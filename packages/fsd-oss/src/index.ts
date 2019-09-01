import * as Path from 'path';
import * as OSS from 'ali-oss';
import * as slash from 'slash';
import * as minimatch from 'minimatch';
import * as Debugger from 'debug';
import * as eachLimit from 'async/eachLimit';
import { URL } from 'url';
import { PassThrough } from 'stream';
import { ReadStreamOptions, WriteStreamOptions, Task, Part, FileMetadata, CreateUrlOptions, WithPromise } from 'fsd';
import { OSSAdapterOptions } from '..';

const debug = Debugger('fsd-oss');

module.exports = class OSSAdapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
  _options: OSSAdapterOptions;
  _oss: OSS;

  constructor(options: OSSAdapterOptions) {
    this.instanceOfFSDAdapter = true;
    this.name = 'OSSAdapter';
    this.needEnsureDir = false;
    /* istanbul ignore if */
    if (!options.accessKeyId) throw new Error('option accessKeyId is required for fsd-oss');
    /* istanbul ignore if */
    if (!options.accessKeySecret) throw new Error('option accessKeySecret is required for fsd-oss');
    options = Object.assign({}, options, { root: options.root || '/' });
    if (options.root[0] !== '/') {
      options.root = `/${options.root}`;
    }
    this._options = options;
    this._oss = new OSS({
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      stsToken: options.stsToken,
      bucket: options.bucket,
      endpoint: options.endpoint,
      region: options.region,
      internal: options.internal,
      secure: options.secure,
      timeout: options.timeout
    });
  }

  async append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    debug('append %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    let options: OSS.AppendObjectOptions = {};
    try {
      // @ts-ignore number -> string
      options.position = await this.size(path);
    } catch (e) { }
    await this._oss.append(p, data, options);
  }

  async createReadStream(path: string, options?: ReadStreamOptions): Promise<NodeJS.ReadableStream> {
    debug('createReadStream %s options: %o', path, options);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    let opts: OSS.GetStreamOptions = {};
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
    let res = await this._oss.getStream(p, opts);
    /* istanbul ignore if */
    if (!res || !res.stream) throw new Error('no stream');
    return res.stream;
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<NodeJS.WritableStream & WithPromise> {
    debug('createWriteStream %s', path);
    if (options && options.start) throw new Error('fsd-oss read stream does not support start options');
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    let stream: NodeJS.WritableStream & WithPromise = new PassThrough();
    stream.promise = this._oss.putStream(p, stream);
    return stream;
  }

  async unlink(path: string): Promise<void> {
    debug('unlink %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    if (path.endsWith('/')) {
      let nextMarker = '';
      do {
        let list = await this._oss.list({
          prefix: p,
          marker: nextMarker,
          'max-keys': 1000
        }, {});
        ({ nextMarker } = list);
        if (list.objects && list.objects.length) {
          let objects = list.objects.map((o) => o.name);
          await this._oss.deleteMulti(objects, {
            quite: true
          });
        }
      } while (nextMarker);
    } else {
      await this._oss.delete(p);
    }
  }

  async mkdir(path: string, prefix?: boolean): Promise<void> {
    debug('mkdir %s', path);
    let parent = Path.dirname(path);
    if (prefix && parent !== '/') {
      parent += '/';
      if (!await this.exists(parent)) {
        debug('mkdir prefix: %s', parent);
        this.mkdir(parent, true);
      }
    }
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    let res = await this._oss.put(p, Buffer.from(''));
    debug('mkdir result: %O', res);
  }

  async readdir(path: string, recursion?: true | string): Promise<Array<{ name: string; metadata: FileMetadata }>> {
    debug('readdir %s', path);
    let delimiter = recursion ? '' : '/';
    let pattern = '';
    if (recursion === true) {
      pattern = '**/**';
    } else if (recursion) {
      pattern = recursion;
    }

    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);

    let results: Array<{ name: string; metadata: FileMetadata }> = [];
    let nextMarker = '';
    do {
      let list = await this._oss.list({
        prefix: p,
        delimiter,
        marker: nextMarker,
        'max-keys': 1000
      }, {});
      debug('list: %O', list);
      ({ nextMarker } = list);
      if (list.objects) {
        list.objects.forEach((object) => {
          let { name } = object;
          let relative = slash(Path.relative(p, name));
          if (!relative) return;
          if (pattern && !minimatch(relative, pattern)) return;
          results.push({
            name: relative,
            metadata: {
              size: object.size,
              lastModified: new Date(object.lastModified)
            }
          });
        });
      }
    } while (nextMarker);
    return results;
  }

  async createUrl(path: string, options?: CreateUrlOptions): Promise<string> {
    debug('createUrl %s', path);
    const { root, urlPrefix, publicRead } = this._options;
    let p = slash(Path.join(root, path));
    if (urlPrefix && publicRead) {
      return urlPrefix + p;
    }
    let url = this._oss.signatureUrl(p.substr(1), options);
    if (urlPrefix) {
      url = url.replace(/https?\:\/\/[^/]+/, urlPrefix);
    }
    return url;
  }

  async copy(path: string, dest: string): Promise<void> {
    debug('copy %s to %s', path, dest);
    // 检查源文件是否存在
    /* istanbul ignore if */
    if (!await this.exists(path)) throw new Error('The source path is not exists!');
    // 检查目标文件是否存在
    /* istanbul ignore if */
    if (await this.exists(dest)) throw new Error('The dest path is already exists!');

    const { root } = this._options;
    let from = slash(Path.join(root, path)).substr(1);
    let to = slash(Path.join(root, dest)).substr(1);

    if (path.endsWith('/')) {
      debug('copy directory %s -> %s', from, to);
      let nextMarker = '';
      do {
        let list = await this._oss.list({
          prefix: from,
          marker: nextMarker,
          'max-keys': 1000
        }, {});
        debug('list result: %O', list);
        ({ nextMarker } = list);
        if (list.objects && list.objects.length) {
          // @ts-ignore eachLimit 有三个参数
          await eachLimit(list.objects, 10, async (object) => {
            let { name } = object;
            debug(' -> copy %s', name);
            let relative = slash(Path.relative(from, name));
            let target = slash(Path.join(to, relative));
            await this._oss.copy(target, name);
          });
        }
      } while (nextMarker);
    } else {
      debug('copy file %s -> %s', from, to);
      await this._oss.copy(to, from);
    }
  }

  async rename(path: string, dest: string): Promise<void> {
    debug('rename %s to %s', path, dest);
    /* istanbul ignore if */
    if (!await this.exists(path)) throw new Error('Source path not found');
    /* istanbul ignore if */
    if (await this.exists(dest)) throw new Error('Target path already exists');
    await this.copy(path, dest);
    await this.unlink(path);
  }

  async exists(path: string): Promise<boolean> {
    debug('check exists %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    // 检查目录是否存在
    if (path.endsWith('/')) {
      let list = await this._oss.list({
        prefix: p,
        'max-keys': 1
      }, {});
      return list.objects && list.objects.length > 0;
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
    let p = slash(Path.join(root, path)).substr(1);
    try {
      await this._oss.head(p);
      return true;
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    debug('check is directory %s', path);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    try {
      await this._oss.head(p);
      return true;
    } catch (e) {
      return false;
    }
  }

  async size(path: string): Promise<number> {
    debug('get file size %s', path);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    let list = await this._oss.list({
      prefix: p,
      'max-keys': 1
    }, {});

    if (!list.objects || !list.objects.length || list.objects[0].name !== p) throw new Error(`${path} is not exist!`);
    return list.objects[0].size;
  }

  async lastModified(path: string): Promise<Date> {
    debug('get file lastModified %s', path);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    let res = await this._oss.head(p);
    let headers: any = res.res.headers;
    return new Date(headers['last-modified'] || headers.date);
  }

  async initMultipartUpload(path: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', path, partCount);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    let res = await this._oss.initMultipartUpload(p);
    let { uploadId } = res;
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push(`task://${uploadId}${path}?${i}`);
    }
    return files;
  }

  async writePart(path: string, partTask: Task, data: NodeJS.ReadableStream, size: number): Promise<Part> {
    debug('writePart %s, task: %s', path, partTask);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    let info = new URL(partTask);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let uploadId = (info.hostname || '').toUpperCase();
    // @ts-ignore _uploadPart
    let res = await this._oss._uploadPart(p, uploadId, info.search.substr(1), {
      stream: data,
      size
    });
    let etag = res.etag.replace(/"/g, '');
    return `${partTask.replace('task://', 'part://')}#${etag}`;
  }

  async completeMultipartUpload(path: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', path);
    let info = new URL(parts[0]);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let uploadId = (info.hostname || '').toUpperCase();
    let p = slash(Path.join(this._options.root, path)).substr(1);
    debug('update id: %s, target: %s', uploadId, p);
    let datas = parts.map((item, key) => ({
      etag: item.split('#')[1],
      number: key + 1
    }));
    await this._oss.completeMultipartUpload(p, uploadId, datas);
  }
};
