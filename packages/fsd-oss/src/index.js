// @flow

import type { ReadStreamOptions, WriteStreamOptions, OSSAdapterOptions } from 'fsd';

const Path = require('path');
const co = require('co');
const fs = require('mz/fs');
const OSS = require('ali-oss');

// const oss = OSS();

module.exports = class OSSAdapter {
  _options: Object;

  constructor(options: OSSAdapterOptions) {
    this._options = OSS(options);
  }

  async append(path: string, data: string | Buffer | stream$Readable): Promise<void> {
    await co(this._options.append(path, data));
  }

  async createReadStream(path: string, options?: ReadStreamOptions): Promise<stream$Readable> {
    return co(this._options.getStream(path, options));
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable> {
    return co(this._options.putStream(path, options));
  }

  async unlink(path: string): Promise<void> {
    let isDirectory = this.isDirectory(path);
    if (isDirectory) {
      let list = await co(this._options.list({ prefix: path + '/' }));
      for (let obj of list) {
        this.unlink(obj.name);
      }
    }
    await co(this._options.delete(path));
  }

  async mkdir(path: string, prefix?: boolean): Promise<void> {
    let p = Path.join(path);
    let parent = Path.dirname(path);
    if (prefix && parent !== '/') {
      // 递归
      try {
        let obj = await co(this._options.get(path));
        if (obj.res.size !== 0) {
          await this.mkdir(parent, true);
        }
      } catch (e) {
        // 目录不存在
        await this.mkdir(parent, true);
      }
    }
    await co(this._options.put(p + '/'));
  }

  async copy(path: string, dist: string): Promise<void> {
    let targetIsExists = await this.exists(dist);
    let targetIsDirectory = await this.isDirectory(dist);
    let sourceIsExists = await this.exists(path);
    let sourceIsDirectory = await this.isDirectory(path);
    let to = dist + '/' + Path.basename(path);
    if (!targetIsDirectory || !targetIsExists) {
      throw new Error('The target path is not found');
    }
    if (!sourceIsExists) {
      throw new Error('The source path is not found');
    }
    if (path === to) {
      throw new Error('The target directory and the source directory are not consistent');
    }
    if (sourceIsDirectory) {
      await co(this._options.copy(path, to));
      let list = await co(this._options.list({ prefix: path + '/' }));
      for (let obj of list) {
        let toPath = dist + obj.name.substr(path.length);
        this.copy(obj.name, toPath);
      }
    }
    await co(this._options.copy(path, to));
  }

  async rename(path: string, dist: string): Promise<void> {
    await co(this.copy(path, dist));
    await co(this.unlink(path));
  }

  async exists(path: string): Promise<boolean> {
    try {
      await co(this._options.get(path));
      return true;
    } catch (e) {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    try {
      let obj = await co(this._options.get(path));
      if (obj.res.size !== 0) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    try {
      let obj = await co(this._options.get(path));
      if (obj.res.size === 0) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async initMultipartUpload(path: string, partCount: number): Promise<string[]> {
    let res = await co(this._options._initMultipartUpload(path));
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
    let res = await co(this._options._uploadPart(path, uploadId, info.query, {
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
    await co(this._options._completeMultipartUpload(path, uploadId, datas));
  }
};
