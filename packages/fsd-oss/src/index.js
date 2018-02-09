// @flow

import type { ReadStreamOptions, WriteStreamOptions, OSSAdapterOptions } from 'fsd';

const co = require('co');
const Path = require('path');
const fs = require('mz/fs');
const OSS = require('ali-oss');

// const oss = OSS();

module.exports = class OSSAdapter {
  _options: Object;

  constructor(options: OSSAdapterOptions) {
    this._options = OSS(options);
  }

  async append(path: string, data: string | Buffer | stream$Readable): Promise<void> {
    
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
};
