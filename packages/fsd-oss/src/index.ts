import * as Path from 'path';
import * as slash from 'slash';
import * as minimatch from 'minimatch';
import * as Debugger from 'debug';
import * as eachLimit from 'async/eachLimit';
import * as RPC from '@alicloud/pop-core';
import SimpleOSSClient from './simple-oss-client';
import { PassThrough } from 'stream';
import {
  ReadStreamOptions,
  WriteStreamOptions,
  Task,
  Part,
  FileMetadata,
  CreateUrlOptions,
  WithPromise
} from 'fsd';
import { OSSAdapterOptions, UploadToken, UploadTokenWithAutoRefresh } from '..';
import { RequestOptions } from '../simple-oss-client';

const debug = Debugger('fsd-oss');
const CALLBACK_BODY =
  // eslint-disable-next-line no-template-curly-in-string
  'bucket=${bucket}&path=${object}&etag=${etag}&size=${size}&mimeType=${mimeType}&height=${imageInfo.height}&width=${imageInfo.width}&format=${imageInfo.format}';

export default class OSSAdapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
  _options: OSSAdapterOptions;
  _oss: SimpleOSSClient;
  _rpc: RPC;
  createUploadToken: (videoId: string, meta?: any) => Promise<UploadToken>;
  createUploadTokenWithAutoRefresh: (
    videoId: string,
    meta?: any
  ) => Promise<UploadTokenWithAutoRefresh>;

  constructor(options: OSSAdapterOptions) {
    this.instanceOfFSDAdapter = true;
    this.name = 'OSSAdapter';
    this.needEnsureDir = false;
    /* istanbul ignore if */
    if (!options.accessKeyId) throw new Error('option accessKeyId is required for fsd-oss');
    /* istanbul ignore if */
    if (!options.accessKeySecret) throw new Error('option accessKeySecret is required for fsd-oss');
    /* istanbul ignore if */
    if (!options.region) throw new Error('option region is required for fsd-oss');
    options = Object.assign({}, options, { root: options.root || '/' });
    if (options.root[0] !== '/') {
      options.root = `/${options.root}`;
    }
    // @ts-ignore
    if (options.endpoint)
      throw new Error(
        'fsd-oss options "endpoint" has been deprecated, please use region/[internal]/[secure] instead!'
      );
    this._options = options;
    this._oss = new SimpleOSSClient({
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      bucket: options.bucket,
      endpoint: `https://${options.region}${options.internal ? '-internal' : ''}.aliyuncs.com`,
      // region: options.region,
      // internal: options.internal,
      // secure: options.secure,
      timeout: parseInt(options.timeout as any) || 0
    });
    if (options.accountId && options.roleName) {
      let stsEndpoint = 'https://sts.aliyuncs.com';
      if (options.region) {
        stsEndpoint = `https://sts.${options.region.replace('oss-', '')}.aliyuncs.com`;
      }
      this._rpc = new RPC({
        accessKeyId: options.accessKeyId,
        accessKeySecret: options.accessKeySecret,
        endpoint: stsEndpoint,
        apiVersion: '2015-04-01'
      });
    }

    this.createUploadToken = async (path: string, meta?: any) => {
      if (!options.accountId || !options.roleName)
        throw new Error('Can not create sts token, missing options: accountId and roleName!');

      path = slash(Path.join(options.root, path)).substring(1);
      let params = {
        RoleArn: `acs:ram::${options.accountId}:role/${options.roleName}`,
        RoleSessionName: 'fsd',
        Policy: JSON.stringify({
          Version: '1',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['oss:PutObject'],
              Resource: [`acs:oss:*:*:${options.bucket}/${path}`]
            }
          ]
        }),
        DurationSeconds: 3600
      };
      let result: any = await this._rpc.request('AssumeRole', params, { method: 'POST' });
      if (result.Message) throw new Error(result.Message);

      let token: UploadToken = {
        auth: {
          accessKeyId: result.Credentials.AccessKeyId,
          accessKeySecret: result.Credentials.AccessKeySecret,
          stsToken: result.Credentials.SecurityToken,
          bucket: options.bucket,
          endpoint: `${options.secure ? 'https' : 'http'}://${options.region}.aliyuncs.com`
        },
        path,
        expiration: result.Credentials.Expiration
      };

      if (options.callbackUrl) {
        token.callback = {
          url: options.callbackUrl,
          body:
            CALLBACK_BODY +
            Object.keys(meta || {})
              .map((key) => `&${key}=\${x:${key}}`)
              .join(''),
          contentType: 'application/x-www-form-urlencoded',
          customValue: meta
        };
      }

      return token;
    };

    this.createUploadTokenWithAutoRefresh = async (videoId: string, meta?: any) => {
      let token = await this.createUploadToken(videoId, meta);
      let auth = token.auth;
      auth = Object.assign({}, auth, {
        refreshSTSToken: async () => {
          let t = await this.createUploadToken(videoId, meta);
          return t.auth;
        }
      });
      return Object.assign({}, token, { auth }) as any;
    };
  }

  async append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    debug('append %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    let position = 0;
    try {
      position = await this.size(path);
    } catch (e) {}
    await this._oss.append(p, data, { position });
  }

  async createReadStream(
    path: string,
    options?: ReadStreamOptions
  ): Promise<NodeJS.ReadableStream> {
    debug('createReadStream %s options: %o', path, options);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    let opts: RequestOptions = {};
    if (options) {
      let start = options.start || 0;
      let end = options.end || 0;
      let Range = '';
      if (start && !end) {
        Range = `${start}-`;
      } else if (end) {
        Range = `${start}-${end}`;
      }
      if (Range) {
        opts.headers = { Range: `bytes=${Range}` };
      }
    }
    return (await this._oss.get(p, opts).stream()) as NodeJS.ReadableStream;
  }

  async createWriteStream(
    path: string,
    options?: WriteStreamOptions
  ): Promise<NodeJS.WritableStream & WithPromise> {
    debug('createWriteStream %s', path);
    if (options?.start) throw new Error('fsd-oss read stream does not support start options');
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    let stream: NodeJS.WritableStream & WithPromise = new PassThrough();
    stream.promise = this._oss.put(p, stream);
    return stream;
  }

  async unlink(path: string): Promise<void> {
    debug('unlink %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    if (path.endsWith('/')) {
      let continuationToken = '';
      do {
        let list = await this._oss.list({
          prefix: p,
          continuationToken,
          maxKeys: 1000
        });
        continuationToken = list.NextContinuationToken;
        if (list.Contents?.length) {
          let objects = list.Contents.map((o) => o.Key);
          await this._oss.deleteMulti(objects, {
            quiet: true
          });
        }
      } while (continuationToken);
    } else {
      await this._oss.del(p);
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
    let res = await this._oss.put(p, Buffer.from(''));
    debug('mkdir result: %O', res);
  }

  async readdir(
    path: string,
    recursion?: true | string
  ): Promise<Array<{ name: string; metadata: FileMetadata }>> {
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

    let results: Array<{ name: string; metadata: FileMetadata }> = [];
    let continuationToken = '';
    do {
      let list = await this._oss.list({
        prefix: p,
        delimiter,
        continuationToken,
        maxKeys: 1000
      });
      debug('list: %O', list);
      continuationToken = list.NextContinuationToken;
      if (list.Contents) {
        list.Contents.forEach((object) => {
          let relative = slash(Path.relative(p, object.Key));
          if (!relative) return;
          if (object.Key.endsWith('/')) relative += '/';
          if (pattern && pattern !== '**/*' && !minimatch(relative, pattern)) return;
          results.push({
            name: relative,
            metadata: {
              size: object.Size,
              lastModified: new Date(object.LastModified)
            }
          });
        });
      }
    } while (continuationToken);
    return results;
  }

  async createUrl(path: string, options?: CreateUrlOptions): Promise<string> {
    debug('createUrl %s', path);
    const { root, urlPrefix, publicRead } = this._options;
    let p = slash(Path.join(root, path));
    if (urlPrefix && publicRead) {
      return urlPrefix + p;
    }
    let url = this._oss.signatureUrl(p.substring(1), options);
    if (urlPrefix) {
      url = url.replace(/https?\:\/\/[^/]+/, urlPrefix);
    }
    return url;
  }

  async copy(path: string, dest: string): Promise<void> {
    debug('copy %s to %s', path, dest);
    // 检查源文件是否存在
    /* istanbul ignore if */
    if (!(await this.exists(path))) throw new Error('The source path is not exists!');

    const { root } = this._options;
    let from = slash(Path.join(root, path)).substring(1);
    let to = slash(Path.join(root, dest)).substring(1);

    if (path.endsWith('/')) {
      debug('copy directory %s -> %s', from, to);
      let continuationToken = '';
      do {
        let list = await this._oss.list({
          prefix: from,
          continuationToken,
          maxKeys: 1000
        });
        debug('list result: %O', list);
        continuationToken = list.NextContinuationToken;
        if (list.Contents?.length) {
          // @ts-ignore eachLimit 有三个参数
          await eachLimit(list.Contents, 10, async (object) => {
            debug(' -> copy %s', object.Key);
            let relative = slash(Path.relative(from, object.Key));
            let target = slash(Path.join(to, relative));
            await this._oss.copy(target, object.Key);
          });
        }
      } while (continuationToken);
    } else {
      debug('copy file %s -> %s', from, to);
      await this._oss.copy(to, from);
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
    // 检查目录是否存在
    if (path.endsWith('/')) {
      let list = await this._oss.list({
        prefix: p,
        maxKeys: 1
      });
      return list.Contents && list.Contents.length > 0;
    }
    // 检查文件是否存在
    try {
      await this._oss.head(p);
      return true;
    } catch (e) {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    debug('check is file %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substring(1);
    try {
      await this._oss.head(p);
      return true;
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    debug('check is directory %s', path);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    try {
      await this._oss.head(p);
      return true;
    } catch (e) {
      return false;
    }
  }

  async size(path: string): Promise<number> {
    debug('get file size %s', path);
    let p = slash(Path.join(this._options.root, path)).substring(1);

    let res = await this._oss.head(p);

    return parseInt(res.headers.get('Content-Length')) || 0;
  }

  async lastModified(path: string): Promise<Date> {
    debug('get file lastModified %s', path);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    let res = await this._oss.head(p);
    let headers = res.headers;
    return new Date(headers.get('Last-Modified'));
  }

  async initMultipartUpload(path: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', path, partCount);
    let p = slash(Path.join(this._options.root, path)).substring(1);
    let { UploadId } = await this._oss.initMultipartUpload(p);
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push(`task://${UploadId}?${i}`);
    }
    return files;
  }

  async writePart(
    path: string,
    partTask: Task,
    data: NodeJS.ReadableStream,
    size: number
  ): Promise<Part> {
    debug('writePart %s, task: %s', path, partTask);
    let p = slash(Path.join(this._options.root, path)).substring(1);

    if (!partTask.startsWith('task://')) throw new Error('Invalid part task id');

    let [uploadId, no] = partTask.replace('task://', '').split('?');
    let res = await this._oss.uploadPart(p, uploadId, parseInt(no), data, {
      headers: {
        'Content-Length': String(size)
      }
    });
    let etag = res.headers.get('ETag').replace(/"/g, '');
    return `${partTask.replace('task://', 'part://')}#${etag}`;
  }

  async completeMultipartUpload(path: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', path);
    let uploadId = parts[0].replace('part://', '').split('?')[0];
    let p = slash(Path.join(this._options.root, path)).substring(1);
    debug('update id: %s, target: %s', uploadId, p);
    let datas = parts.map((item, key) => ({
      etag: item.split('#')[1],
      number: key + 1
    }));
    await this._oss.completeMultipartUpload(p, uploadId, datas);
  }
}
