// @flow

import type { ReadStreamOptions, WriteStreamOptions, OSSAdapterOptions, Task, Part } from 'fsd';

const util = require('util');
const Path = require('path');
const URL = require('url');
const co = require('co');
const OSS = require('ali-oss');
const slash = require('slash');
const { PassThrough } = require('stream');
const minimatch = require('minimatch');
const eachLimit = util.promisify(require('async/eachLimit'));
const debug = require('debug')('fsd-oss');

module.exports = class OSSAdapter {
  name: string;
  _options: OSSAdapterOptions;
  _oss: Object;

  constructor(options: OSSAdapterOptions) {
    this.name = 'OSSAdapter';
    /* istanbul ignore if */
    if (!options.accessKeyId) throw new Error('option accessKeyId is required for fsd-oss');
    /* istanbul ignore if */
    if (!options.accessKeySecret) throw new Error('option accessKeySecret is required for fsd-oss');
    // $Flow
    options = Object.assign({}, options, { root: options.root || '/' });
    if (options.root[0] !== '/') {
      options.root = '/' + options.root;
    }
    this._options = options;
    this._oss = OSS({
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
    let { urlPrefix } = options;
    if (urlPrefix && urlPrefix.endsWith('/')) {
      urlPrefix = urlPrefix.substr(0, urlPrefix.length - 1);
      options.urlPrefix = urlPrefix;
    }
  }

  async append(path: string, data: string | Buffer | stream$Readable): Promise<void> {
    debug('append %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    await co(this._oss.append(p, data));
  }

  async createReadStream(path: string, options?: ReadStreamOptions): Promise<stream$Readable> {
    debug('createReadStream %s options: %o', path, options);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    let opts = {};
    if (options) {
      let start = options.start || 0;
      let end = options.end || 0;
      let Range = '';
      if (start && !end) {
        Range = start + '-';
      } else if (end) {
        Range = start + '-' + end;
      }
      if (Range) {
        opts.headers = { Range: 'bytes=' + Range };
      }
    }
    let res = await co(this._oss.getStream(p, opts));
    /* istanbul ignore if */
    if (!res || !res.stream) throw new Error('no stream');
    return res.stream;
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable> {
    debug('createWriteStream %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    let stream = new PassThrough();
    co(this._oss.putStream(p, stream));
    return stream;
  }

  async unlink(path: string): Promise<void> {
    debug('unlink %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    let isExists = await this.exists(path);
    if (!isExists) return;
    if (path.endsWith('/')) {
      let nextMarker = '';
      let dirs = [];
      do {
        let list = await co(this._oss.list({
          prefix: p,
          marker: nextMarker,
          'max-keys': 1000
        }));
        nextMarker = list.nextMarker;
        if (list.objects && list.objects.length) {
          await eachLimit(list.objects, 10, async (object) => {
            let { name } = object;
            if (name.endsWith('/')) {
              dirs.unshift(name);
              return;
            }
            await co(this._oss.delete(name));
          });
        }
      } while (nextMarker);
      if (dirs.length) {
        debug('remove dirs: %o', dirs);
        await eachLimit(dirs, 10, async (dir) => {
          await co(this._oss.delete(dir));
        });
      }
    } else {
      await co(this._oss.delete(p));
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
    let res = await co(this._oss.put(p, Buffer.from('')));
    debug('mkdir result: %O', res);
  }

  async readdir(path: string, recursion?: true | string): Promise<string[]> {
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

    let results: string[] = [];
    let nextMarker = '';
    do {
      let list = await co(this._oss.list({
        prefix: p,
        delimiter,
        marker: nextMarker,
        'max-keys': 1000
      }));
      debug('list: %O', list);
      nextMarker = list.nextMarker;
      if (list.objects) {
        list.objects.forEach((object) => {
          let { name } = object;
          let relative = slash(Path.relative(p, name));
          if (!relative) return;
          if (pattern && !minimatch(relative, pattern)) return;
          results.push(relative);
        });
      }
    } while (nextMarker);
    return results;
  }

  async createUrl(path: string): Promise<string> {
    debug('readdir %s', path);
    let { urlPrefix } = this._options;
    return urlPrefix + path;
  }

  async copy(path: string, dest: string): Promise<void> {
    debug('copy %s to %s', path, dest);
    // 检查源文件是否存在
    /* istanbul ignore if */
    if (!await this.exists(path)) throw new Error('The source path is not exists!');
    // 检查目标文件是否存在
    /* istanbul ignore if */
    if (await this.exists(dest)) throw new Error('The dest path is already exists!');
    // 检查目标目录是否存在
    let destDir = Path.dirname(dest) + '/';
    /* istanbul ignore if */
    if (!await this.exists(destDir)) throw new Error('The target directory is not exists!');

    const { root } = this._options;
    let from = slash(Path.join(root, path)).substr(1);
    let to = slash(Path.join(root, dest)).substr(1);

    if (path.endsWith('/')) {
      debug('copy directory %s -> %s', from, to);
      let nextMarker = '';
      do {
        let list = await co(this._oss.list({
          prefix: from,
          marker: nextMarker,
          'max-keys': 1000
        }));
        debug('list result: %O', list);
        nextMarker = list.nextMarker;
        if (list.objects && list.objects.length) {
          await eachLimit(list.objects, 10, async (object) => {
            let { name } = object;
            debug(' -> copy %s', name);
            let relative = slash(Path.relative(from, name));
            let target = slash(Path.join(to, relative));
            await co(this._oss.copy(target, name));
          });
        }
      } while (nextMarker);
    } else {
      debug('copy file %s -> %s', from, to);
      await co(this._oss.copy(to, from));
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
    debug('full path: %s', p);
    try {
      let res = await co(this._oss.head(p));
      debug('head result: %O', res);
      return true;
    } catch (e) {
      debug('head error: %O', e);
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    debug('check is file %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    try {
      await co(this._oss.head(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    debug('check is directory %s', path);
    const { root } = this._options;
    let p = slash(Path.join(root, path)).substr(1);
    try {
      await co(this._oss.head(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async initMultipartUpload(path: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', path, partCount);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    let res = await co(this._oss._initMultipartUpload(p));
    let { uploadId } = res;
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push('task:' + uploadId + path + '?' + i);
    }
    return files;
  }

  async writePart(path: Task, partTask: string, data: stream$Readable, size: number): Promise<Part> {
    debug('writePart %s, task: %s', path, partTask);
    let p = slash(Path.join(this._options.root, path)).substr(1);
    let info = URL.parse(partTask);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let uploadId = (info.hostname || '').toUpperCase();
    let res = await co(this._oss._uploadPart(p, uploadId, info.query, {
      stream: data,
      size
    }));
    let etag = res.etag.replace(/"/g, '');
    return partTask.replace('task:', 'part:') + '#' + etag;
  }

  async completeMultipartUpload(path: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', path);
    let info = URL.parse(parts[0]);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let uploadId = (info.hostname || '').toUpperCase();
    let p = slash(Path.join(this._options.root, path)).substr(1);
    debug('update id: %s, target: %s', uploadId, p);
    let datas = parts.map((item, key) => ({
      etag: item.split('#')[1],
      number: key + 1
    }));
    await co(this._oss._completeMultipartUpload(p, uploadId, datas));
  }
};
