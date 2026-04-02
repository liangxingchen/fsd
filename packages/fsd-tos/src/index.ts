import Path from 'path';
import slash from 'slash';
import { minimatch } from 'minimatch';
import Debugger from 'debug';
import { PassThrough } from 'stream';
import SimpleTOSClient, { assumeRole } from './simple-tos-client';
import type {
  ReadStreamOptions,
  WriteStreamOptions,
  Task,
  Part,
  FileMetadata,
  CreateUrlOptions,
  WithPromise
} from 'fsd';
import type { TOSAdapterOptions, UploadToken, UploadTokenWithAutoRefresh } from '..';

const debug = Debugger('fsd-tos');

export default class TOSAdapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
  _options: TOSAdapterOptions;
  _tos: SimpleTOSClient;
  createUploadToken: (path: string, meta?: any, durationSeconds?: number) => Promise<UploadToken>;
  createUploadTokenWithAutoRefresh: (
    path: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;

  constructor(options: TOSAdapterOptions) {
    this.instanceOfFSDAdapter = true;
    this.name = 'TOSAdapter';
    this.needEnsureDir = false;
    /* istanbul ignore if */
    if (!options.accessKeyId) throw new Error('option accessKeyId is required for fsd-tos');
    /* istanbul ignore if */
    if (!options.accessKeySecret) throw new Error('option accessKeySecret is required for fsd-tos');
    /* istanbul ignore if */
    if (!options.region) throw new Error('option region is required for fsd-tos');
    options = Object.assign({}, options, { root: options.root || '/' });
    if (options.root[0] !== '/') {
      options.root = `/${options.root}`;
    }
    this._options = options;
    let endpoint = options.endpoint || `tos-${options.region}.volces.com`;
    this._tos = new SimpleTOSClient({
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      region: options.region,
      bucket: options.bucket,
      endpoint,
      stsToken: options.stsToken,
      timeout: options.timeout
    });

    this.createUploadToken = async (path: string, meta?: any, durationSeconds?: number) => {
      if (!options.accountId || !options.roleName)
        throw new Error('Can not create sts token, missing options: accountId and roleName!');

      path = slash(Path.join(options.root, path)).substring(1);
      let result = await assumeRole(options.accessKeyId, options.accessKeySecret, {
        RoleTrn: `trn:iam::${options.accountId}:role/${options.roleName}`,
        RoleSessionName: 'fsd',
        Policy: JSON.stringify({
          Version: '1',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['tos:PutObject'],
              Resource: [`trn:tos:*:*:${options.bucket}/${path}`]
            }
          ]
        }),
        DurationSeconds: durationSeconds || 3600
      });
      if (result.ResponseMetadata?.Error) {
        throw new Error(result.ResponseMetadata.Error.Message);
      }
      let creds = result.Result!.Credentials;

      let token: UploadToken = {
        auth: {
          accessKeyId: creds.AccessKeyId,
          accessKeySecret: creds.SecretAccessKey,
          stsToken: creds.SessionToken,
          bucket: options.bucket,
          endpoint: `tos-${options.region}.volces.com`
        },
        path,
        expiration: creds.ExpiredTime
      };

      if (options.callbackUrl) {
        token.callback = {
          url: options.callbackUrl,
          body: Object.keys(meta || {})
            .map((key) => `${key}=\${x:${key}}`)
            .join('&'),
          contentType: 'application/x-www-form-urlencoded',
          customValue: meta
        };
      }

      return token;
    };

    this.createUploadTokenWithAutoRefresh = async (
      path: string,
      meta?: any,
      durationSeconds?: number
    ) => {
      let token = await this.createUploadToken(path, meta, durationSeconds);
      let auth = token.auth;
      auth = Object.assign({}, auth, {
        refreshSTSToken: async () => {
          let t = await this.createUploadToken(path, meta, durationSeconds);
          return t.auth;
        }
      });
      return Object.assign({}, token, { auth }) as UploadTokenWithAutoRefresh;
    };
  }

  async append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    debug('append %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    if (Buffer.isBuffer(data)) {
      let position = 0;
      try {
        position = await this.size(path);
      } catch (_e) {}
      await this._tos.append(p, data, position);
    } else {
      let chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        data.on('data', (chunk: Buffer) => chunks.push(chunk));
        data.on('end', resolve);
        data.on('error', reject);
      });
      let buf = Buffer.concat(chunks);
      let position = 0;
      try {
        position = await this.size(path);
      } catch (_e) {}
      await this._tos.append(p, buf, position);
    }
  }

  async createReadStream(
    path: string,
    options?: ReadStreamOptions
  ): Promise<NodeJS.ReadableStream> {
    debug('createReadStream %s options: %o', path, options);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    let opts: any = {};
    if (options) {
      if (typeof options.start === 'number') {
        opts.headers = opts.headers || {};
        opts.headers['Range'] = `bytes=${options.start}-`;
      }
      if (typeof options.end === 'number') {
        opts.headers = opts.headers || {};
        let start = options.start || 0;
        opts.headers['Range'] = `bytes=${start}-${options.end}`;
      }
    }
    let result: any = await this._tos.get(p, opts).response();
    return result.body;
  }

  async createWriteStream(
    path: string,
    options?: WriteStreamOptions
  ): Promise<NodeJS.WritableStream & WithPromise> {
    debug('createWriteStream %s', path);
    if (options?.start) throw new Error('fsd-tos write stream does not support start options');
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    let stream: NodeJS.WritableStream & WithPromise = new PassThrough();
    stream.promise = this._tos.put(p, stream as any);
    return stream;
  }

  async unlink(path: string): Promise<void> {
    debug('unlink %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    if (path.endsWith('/')) {
      let continuationToken = '';
      do {
        let result = await this._tos.listObjectsType2({
          prefix: p,
          continuationToken,
          maxKeys: 1000
        });
        debug('unlink list: %O', result);
        let list = result;
        continuationToken = list.NextContinuationToken || '';
        if (list.Contents?.length) {
          let objects = list.Contents.map((o) => ({ key: o.Key }));
          await this._tos.deleteMultiObjects(objects, { quiet: true });
        }
      } while (continuationToken);
    } else {
      await this._tos.del(p);
    }
  }

  async mkdir(path: string, recursive?: boolean): Promise<void> {
    debug('mkdir %s', path);
    let parent = Path.dirname(path);
    if (recursive && parent !== '/') {
      parent += '/';
      if (!(await this.exists(parent))) {
        debug('mkdir prefix: %s', parent);
        this.mkdir(parent, true);
      }
    }
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    await this._tos.put(p, Buffer.from(''));
  }

  async readdir(
    path: string,
    recursion?: true | string
  ): Promise<Array<{ name: string; metadata?: FileMetadata }>> {
    debug('readdir %s', path);
    let delimiter = recursion ? '' : '/';
    let pattern = '';
    if (recursion === true) {
      pattern = '**/*';
    } else if (recursion) {
      pattern = recursion;
    }

    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);

    let results: Record<string, { name: string; metadata?: FileMetadata }> = Object.create(null);
    let continuationToken = '';
    let hasContents = false;
    let hasCommonPrefixes = false;
    do {
      let result = await this._tos.listObjectsType2({
        prefix: p,
        delimiter,
        continuationToken,
        maxKeys: 1000
      });
      let list = result;
      debug('list: %O', list);
      continuationToken = list.NextContinuationToken || '';
      if (list.Contents) {
        hasContents = true;
        list.Contents.forEach((object: any) => {
          let relative = slash(Path.relative(p, object.Key));
          if (!relative) return;
          if (object.Key.endsWith('/')) relative += '/';
          if (pattern && pattern !== '**/*' && !minimatch(relative, pattern)) return;
          results[relative] = {
            name: relative,
            metadata: {
              size: object.Size,
              lastModified: new Date(object.LastModified)
            }
          };
        });
      }
      if (list.CommonPrefixes) {
        hasCommonPrefixes = true;
        list.CommonPrefixes.forEach((item: any) => {
          let relative = slash(Path.relative(p, item.Prefix));
          if (!relative) return;
          relative += '/';
          results[relative] = {
            name: relative
          };
        });
      }
    } while (continuationToken);
    if (hasContents && hasCommonPrefixes) {
      return Object.keys(results)
        .sort()
        .map((key) => results[key]);
    }
    return Object.values(results);
  }

  async createUrl(path: string, options?: CreateUrlOptions): Promise<string> {
    debug('createUrl %s', path);
    options = Object.assign({}, options);
    const { root, urlPrefix, publicRead } = this._options;
    let p = slash(Path.join(root, path));
    if (urlPrefix && publicRead) {
      return urlPrefix + p;
    }
    let url = this._tos.getPreSignedUrl(p.substring(1), {
      method: 'GET',
      expires: options?.expires || 3600,
      response: options?.response as any
    });
    if (urlPrefix) {
      url = url.replace(/https?:\/\/[^/]+/, urlPrefix);
    }
    return url;
  }

  async copy(path: string, dest: string): Promise<void> {
    debug('copy %s to %s', path, dest);
    /* istanbul ignore if */
    if (!(await this.exists(path))) throw new Error('The source path is not exists!');

    const { root, bucket } = this._options;
    let from = slash(Path.join(root, path)).substring(1);
    let to = slash(Path.join(root, dest)).substring(1);

    if (path.endsWith('/')) {
      debug('copy directory %s -> %s', from, to);
      let continuationToken = '';
      do {
        let result = await this._tos.listObjectsType2({
          prefix: from,
          continuationToken,
          maxKeys: 1000
        });
        let list = result;
        debug('list result: %O', list);
        continuationToken = list.NextContinuationToken || '';
        if (list.Contents?.length) {
          for (let object of list.Contents) {
            debug(' -> copy %s', object.Key);
            let relative = slash(Path.relative(from, object.Key));
            let target = slash(Path.join(to, relative));
            await this._tos.copyObject(target, bucket, object.Key);
          }
        }
      } while (continuationToken);
    } else {
      debug('copy file %s -> %s', from, to);
      await this._tos.copyObject(to, bucket, from);
    }
  }

  async rename(path: string, dest: string): Promise<void> {
    debug('rename %s to %s', path, dest);
    /* istanbul ignore if */
    if (!(await this.exists(path))) throw new Error('Source path not found');
    /* istanbul ignore if */
    if (await this.exists(dest)) throw new Error('Target path already exists');
    await this.copy(path, dest);
    await this.unlink(path);
  }

  async exists(path: string): Promise<boolean> {
    debug('check exists %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    if (path.endsWith('/')) {
      let result = await this._tos.listObjectsType2({
        prefix: p,
        maxKeys: 1
      });
      return Array.isArray(result.Contents) && result.Contents.length > 0;
    }
    try {
      await this._tos.head(p);
      return true;
    } catch (_e) {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    debug('check is file %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    try {
      await this._tos.head(p);
      return true;
    } catch (_e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    debug('check is directory %s', path);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    try {
      await this._tos.head(p);
      return true;
    } catch (_e) {
      return false;
    }
  }

  async size(path: string): Promise<number> {
    debug('get file size %s', path);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    let result = await this._tos.head(p);
    return parseInt(result.headers.get('content-length')) || 0;
  }

  async lastModified(path: string): Promise<Date> {
    debug('get file lastModified %s', path);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    let result = await this._tos.head(p);
    return new Date(result.headers.get('last-modified'));
  }

  async initMultipartUpload(path: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', path, partCount);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    let result = await this._tos.createMultipartUpload(p);
    let uploadId = result.UploadId;
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push(`task://${uploadId}?${i}`);
    }
    return files;
  }

  async writePart(
    path: string,
    partTask: Task,
    data: NodeJS.ReadableStream,
    _size: number
  ): Promise<Part> {
    debug('writePart %s, task: %s', path, partTask);
    let p = slash(Path.join(this._options.root, path)).substring(1);

    if (!partTask.startsWith('task://')) throw new Error('Invalid part task id');

    let [uploadId, no] = partTask.replace('task://', '').split('?');
    let result = await this._tos.uploadPart(p, uploadId, parseInt(no), data);
    let etag = result.headers.get('etag') || result.ETag || '';
    etag = etag.replace(/"/g, '');
    return `${partTask.replace('task://', 'part://')}#${etag}`;
  }

  async completeMultipartUpload(path: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', path);
    let uploadId = parts[0].replace('part://', '').split('?')[0];
    let p = slash(Path.join(this._options.root, path)).substring(1);
    debug('upload id: %s, target: %s', uploadId, p);
    let mappedParts = parts.map((item, key) => ({
      eTag: item.split('#')[1],
      partNumber: key + 1
    }));
    await this._tos.completeMultipartUpload(p, uploadId, mappedParts);
  }
}
