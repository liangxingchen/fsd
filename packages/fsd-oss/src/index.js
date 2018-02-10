// @flow

import type { ReadStreamOptions, WriteStreamOptions, OSSAdapterOptions } from 'fsd';

const Path = require('path');
const buffer = require('buffer');
const co = require('co');
const fs = require('mz/fs');
const OSS = require('ali-oss');
const _ = require('lodash');

module.exports = class OSSAdapter {
  _options: OSSAdapterOptions;
  _oss: Object;

  constructor(options: OSSAdapterOptions) {
    this._options = Object.assign({
      root: '/',
      urlPrefix: '',
      keyId: process.env.FILE_OSS_KEYID || '',
      secret: process.env.FILE_OSS_SECRET || '',
      bucket: '',
      endpoint: ''
    }, options);
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
    await co(this._oss.append(p, data));
  }

  async createReadStream(path: string, options?: ReadStreamOptions): Promise<stream$Readable> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    return co(this._oss.getStream(p, options));
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    return co(this._oss.putStream(p, options));
  }

  async unlink(path: string): Promise<void> {
    const { root } = this._options;
    let p = Path.join(root, path);
    p = p.startsWith('/') ? p.substr(1) : p;
    let isExists = await this.exists(p);
    if (!isExists) throw new Error('The source path is not found');
    let isDirectory = await this.isDirectory(p);
    if (isDirectory) {
      p = p.endsWith('/') ? p : p + '/';
      let list = await co(this._oss.list({ prefix: p }));
      for (let obj of list.objects) {
        let name = obj.name.substr(root.length);
        this.unlink(name);
      }
    }
    await co(this._oss.delete(p));
  }

  async mkdir(path: string, prefix?: boolean): Promise<void> {
    const { root } = this._options;
    let p = Path.join(root, path);
    let parent = Path.dirname(path);
    if (prefix && parent !== '/') {
      try {
        await co(this._oss.get(Path.join(root, parent) + '/'));
      } catch (e) {
        // 目录不存在
        await this.mkdir(parent, true);
      }
    }
    if (p.startsWith('/')) {
      p = p.substr(1);
    }
    await co(this._oss.put(p + '/', buffer.from('')));
  }

  async createUrl(path: string): Promise<string> {
    let { urlPrefix } = this._options;
    return urlPrefix + path;
  }

  async readdir(path: string, recursion?: true | string): Promise<string[]> {
    const { root } = this._options;
    let p = Path.join(root, path);
    if (p.startsWith('/')) {
      p = p.substr(1);
    }
    if (!p.endsWith('/')) {
      p += '/';
    }
    let isExists = await this.exists(p);
    if (!isExists) {
      throw new Error('The path is not found');
    }
    let list = await co(this._oss.list({ prefix: p }));
    for (let obj of list.objects) {
      if (obj.name.endsWith('/')) {
        list.objects.concat(this.readdir(obj.name, recursion));
      }
    }
    return list.objects;
  }

  async copy(path: string, dist: string): Promise<void> {
    const { root } = this._options;
    let from = Path.join(root, path);
    from = from.startsWith('/') ? from.substr(1) : from;
    let to = Path.join(root, dist, Path.basename(path));
    to = to.startsWith('/') ? to.substr(1) : to;
    let isSourceExists = await this.exists(from);
    let isSourceDirectory = await this.isDirectory(from);
    let isTargetExists = await this.exists(to);
    let isTargetDirectory = await this.isDirectory(to);
    if (!isSourceExists) {
      throw new Error('The source path is not found');
    }
    if (!isTargetExists || !isTargetDirectory) {
      throw new Error('The target path is not found');
    }
    if (from === to) {
      throw new Error('The target directory and the source directory are not consistent');
    }
    if (isSourceDirectory) {
      from = from.endsWith('/') ? from : from + '/';
      let list = await co(this._oss.list({ prefix: from }));
      for (let obj of list.objects) {
        let fromPath = obj.name.substr(root.length);
        let toPath = to.substr(root.length);
        this.copy(fromPath, toPath);
      }
    }
    await co(this._oss.copy(from, to));
  }

  async rename(path: string, dist: string): Promise<void> {
    const { root } = this._options;
    let from = Path.join(root, path);
    from = from.startsWith('/') ? from.substr(1) : from;
    let to = Path.join(root, dist);
    to = to.startsWith('/') ? to.substr(1) : to;
    let isSourceExists = await this.exists(from);
    let isTargetExists = await this.exists(to);
    if (!isSourceExists) throw new Error('The source path is not found');
    if (isTargetExists) throw new Error('Already exists');
    let p = path;
    try {
      await co(this.copy(path, dist));
    } catch (e) {
      p = dist;
    }
    await co(this.unlink(p));
  }

  async exists(path: string): Promise<boolean> {
    const { root } = this._options;
    let p = Path.join(root, path);
    let isFile = true;
    if (p.startsWith('/')) {
      p = path.substr(1);
    }
    if (!p.endsWith('/')) {
      try {
        await co(this._oss.get(p));
        return true;
      } catch (e) {
        isFile = false;
      }
    }
    if (p.endsWith('/') || !isFile) {
      try {
        await co(this._oss.get(p));
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async isFile(path: string): Promise<boolean> {
    const { root } = this._options;
    let p = Path.join(root, path);
    if (p.startsWith('/')) {
      p = path.substr(1);
    }
    try {
      await co(this._oss.get(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    const { root } = this._options;
    let p = Path.join(root, path);
    if (p.startsWith('/')) {
      p = path.substr(1);
    }
    if (!p.endsWith('/')) {
      p += '/';
    }
    try {
      await co(this._oss.get(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  async initMultipartUpload(path: string, partCount: number): Promise<string[]> {
    let res = await co(this._oss._initMultipartUpload(path));
    let taskId = 'upload-' + res.uploadId + '-';
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push('part:' + taskId + i + path + '?' + i);
    }
    return files;
  }

  async writePart(path: string, partTask: string, data: stream$Readable): Promise<string> {
    let info = URL.parse(partTask);
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let stats = await fs.stat(path);
    let matchs = info.hostname.match(/upload-(.+)-\d/);
    if (!matchs) throw new Error('Invalid part hostname');
    let uploadId = matchs[1];
    let res = await co(this._oss._uploadPart(path, uploadId, info.query, {
      stream: data,
      size: stats.size
    }));
    let etag = res.etag.replace(/"/g, '');
    return uploadId + ',' + etag;
  }

  async completeMultipartUpload(path: string, parts: string[]): Promise<void> {
    let onePart = parts[0];
    let uploadId = onePart.split(',')[0];
    let datas = parts.map((item, key) => ({
      etag: item.split(',')[1],
      number: key + 1
    }));
    await co(this._oss._completeMultipartUpload(path, uploadId, datas));
  }
};
