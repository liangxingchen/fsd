// @flow

import type { ReadStreamOptions, WriteStreamOptions, OSSAdapterOptions } from 'fsd';

const Path = require('path');
const URL = require('url');
const co = require('co');
const OSS = require('ali-oss');
const _ = require('lodash');
const { PassThrough } = require('stream');
const minimatch = require('minimatch');

module.exports = class OSSAdapter {
  _options: OSSAdapterOptions;
  _oss: Object;

  constructor(options: OSSAdapterOptions) {
    let optionRoot = options.root ? options.root : '';
    let root = optionRoot.startsWith('/') ? optionRoot.substr(1) : '';
    this._options = Object.assign({
      root: '',
      urlPrefix: '',
      keyId: '',
      secret: '',
      bucket: '',
      endpoint: ''
    }, options, { root });
    this._oss = OSS({
      accessKeyId: this._options.keyId,
      accessKeySecret: this._options.secret,
      bucket: this._options.bucket,
      endpoint: this._options.endpoint
    });
    let { urlPrefix } = this._options;
    if (urlPrefix.endsWith('/')) {
      urlPrefix = urlPrefix.substr(0, urlPrefix.length - 1);
      this._options.urlPrefix = urlPrefix;
    }
  }

  async append(path: string, data: string | Buffer | stream$Readable): Promise<void> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    await co(this._oss.append(p, data));
  }

  async createReadStream(path: string, options?: ReadStreamOptions): Promise<stream$Readable> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    let res = await co(this._oss.getStream(p));
    if (!res || !res.stream) {
      throw new Error('no stream');
    }
    return res.stream;
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    let stream = new PassThrough();
    co(this._oss.putStream(p, stream));
    return stream;
  }

  async unlink(path: string): Promise<void> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    let isExists = await this.exists(path);
    if (!isExists) return;
    if (path.endsWith('/')) {
      let results = [];
      let nextMarker = '';
      do {
        let list = this._oss.list({
          prefix: p,
          marker: nextMarker,
          'max-keys': 1000
        });
        if (list.objects) {
          results = results.concat(list.objects);
          nextMarker = list.nextMarker;
        }
      } while (nextMarker);
      let objects = _.filter(results, (obj) => obj.name !== p);
      if (objects && objects.length > 0) {
        await Promise.all(objects.map(async(obj) => {
          return await co(this._oss.delete(obj.name));
        }));
      }
    }
    await co(this._oss.delete(p));
  }

  async mkdir(path: string, prefix?: boolean): Promise<void> {
    const { root } = this._options;
    if (path.endsWith('/')) {
      path = path.substr(0, path.length - 1);
    }
    let p = Path.join(root, path);
    let parent = Path.dirname(path);
    if (prefix && parent !== '/') {
      try {
        await co(this._oss.head(Path.join(root, parent) + '/'));
      } catch (e) {
        // 目录不存在
        await this.mkdir(parent, true);
      }
    }
    await co(this._oss.put(p + '/', Buffer.from('')));
  }

  async createUrl(path: string): Promise<string> {
    let { urlPrefix } = this._options;
    return urlPrefix + path;
  }

  async readdir(path: string, recursion?: true | string): Promise<string[]> {
    const { root } = this._options;
    let results = [];
    let nextMarker = '';
    let p = Path.join(root, path);
    let isExists = await this.exists(path);
    if (!isExists) throw new Error('The path is not found');
    let delimiter = recursion ? '' : '/';
    if (recursion === true) {
      recursion = '**/**';
    }
    let pattern = recursion || '**';
    do {
      let list = await co(this._oss.list({
        prefix: p,
        delimiter,
        marker: nextMarker,
        'max-keys': 1000
      }));
      if (list.objects) {
        results = results.concat(list.objects);
        nextMarker = list.nextMarker;
      }
      if (list.prefixes) {
        let rootDirectory = _.map(list.prefixes, (item) => {
          return { name: item };
        });
        results = results.concat(rootDirectory);
      }
    } while (nextMarker);
    let objects = _.filter(results, (obj) => obj.name !== p);
    objects = _.filter(objects, (obj) => {
      let name = obj.name.endsWith('/') ? obj.name.substr(0, obj.name.length - 1) : obj.name;
      return minimatch(name, pattern);
    });
    let names = _.map(objects, (obj) => {
      let name = obj.name.endsWith('/') ? obj.name.substr(0, obj.name.length - 1) : obj.name;
      return name.substr(p.length);
    });
    return names;
  }

  async copy(path: string, dist: string): Promise<void> {
    const { root } = this._options;
    let from = Path.join(root, path);
    let to = Path.join(root, dist);
    let isSourceExists = await this.exists(path);
    if (!isSourceExists) throw new Error('The source path is not found');
    let p = dist.endsWith('/') ? Path.dirname(dist.substr(0, dist.length - 1)) + '/' : Path.dirname(dist) + '/';
    let isTargetExists = await this.exists(p);
    if (!isTargetExists) throw new Error('The target path is not found');
    if (path.endsWith('/')) {
      let results = [];
      let nextMarker = '';
      do {
        let list = await co(this._oss.list({
          prefix: from,
          marker: nextMarker,
          'max-keys': 1000
        }));
        if (list.objects) {
          results = results.concat(list.objects);
          nextMarker = list.nextMarker;
        }
      } while (nextMarker);
      let objects = _.filter(results, (obj) => obj.name !== from);
      if (objects && objects.length > 0) {
        await Promise.all(objects.map(async(obj) => {
          let name = obj.name.substr(from.length);
          return await co(this._oss.copy(Path.join(to, name), obj.name));
        }));
        // for (let obj of objects) {
        //   let name = obj.name.substr(from.length);
        //   this._oss.copy(Path.join(to, name), obj.name);
        // }
      }
    }
    await co(this._oss.copy(to, from));
  }

  async rename(path: string, dist: string): Promise<void> {
    let isSourceExists = await this.exists(path);
    let isTargetExists = await this.exists(dist);
    if (!isSourceExists) throw new Error('The source path is not found');
    if (isTargetExists) throw new Error('Already exists');
    await this.copy(path, dist);
    await this.unlink(path);
  }

  async exists(path: string): Promise<boolean> {
    const { root } = this._options;
    let p = Path.join(root, path);
    try {
      await co(this._oss.head(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    const { root } = this._options;
    let p = Path.join(root, path);
    try {
      await co(this._oss.head(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    const { root } = this._options;
    let p = Path.join(root, path);
    try {
      await co(this._oss.head(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async initMultipartUpload(path: string, partCount: number): Promise<string[]> {
    let p = Path.join(this._options.root, path);
    let res = await co(this._oss._initMultipartUpload(p));
    let taskId = 'upload-' + res.uploadId + '-';
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push('part:' + taskId + i + path + '?' + i);
    }
    return files;
  }

  async writePart(path: string, partTask: string, data: stream$Readable, size: number): Promise<string> {
    let p = Path.join(this._options.root, path);
    let info = URL.parse(partTask);
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let matchs = partTask.match(/^part:upload-(.+)-\d/);
    if (!matchs) throw new Error('Invalid part hostname');
    let uploadId = matchs[1];
    let res = await co(this._oss._uploadPart(p, uploadId, info.query, {
      stream: data,
      size
    }));
    let etag = res.etag.replace(/"/g, '');
    return uploadId + ',' + etag;
  }

  async completeMultipartUpload(path: string, parts: string[]): Promise<void> {
    let p = Path.join(this._options.root, path);
    let onePart = parts[0];
    let uploadId = onePart.split(',')[0];
    let datas = parts.map((item, key) => ({
      etag: item.split(',')[1],
      number: key + 1
    }));
    await co(this._oss._completeMultipartUpload(p, uploadId, datas));
  }
};
