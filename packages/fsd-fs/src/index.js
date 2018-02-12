//@flow

import type { ReadStreamOptions, WriteStreamOptions, FSAdapterOptions } from 'fsd';

const os = require('os');
const URL = require('url');
const Path = require('path');
const fs = require('mz/fs');
const isStream = require('is-stream');
const glob = require('glob');
const rimraf = require('rimraf');

module.exports = class FSAdapter {
  name: string;
  _options: FSAdapterOptions;

  constructor(options: FSAdapterOptions) {
    this.name = 'FSAdapter';
    this._options = Object.assign({
      urlPrefix: '',
      root: '/',
      mode: 0o666,
      tmpdir: os.tmpdir()
    }, options);
    let { urlPrefix } = this._options;
    if (urlPrefix.endsWith('/')) {
      urlPrefix = urlPrefix.substr(0, urlPrefix.length - 1);
      this._options.urlPrefix = urlPrefix;
    }
  }

  async append(path: string, data: string | Buffer | stream$Readable): Promise<void> {
    let { root, mode } = this._options;
    let p = Path.join(root, path);
    if (isStream.readable(data)) {
      // $Flow
      let stream: stream$Readable = data;
      await new Promise((resolve, reject) => {
        fs.stat(p, (error, stat) => {
          let start = error ? 0 : stat.size;
          let writeStream = fs.createWriteStream(p, {
            mode,
            start
          });
          stream.pipe(writeStream).on('close', resolve).on('error', reject);
        });
      });
      return;
    }
    await fs.appendFile(p, data, { mode });
  }

  async createReadStream(path: string, options?: ReadStreamOptions): Promise<stream$Readable> {
    let p = Path.join(this._options.root, path);
    return fs.createReadStream(p, options);
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable> {
    let p = Path.join(this._options.root, path);
    if (path.startsWith('part:')) {
      let info = URL.parse(path);
      if (!info.pathname) throw new Error('Invalid part pathname');
      p = Path.join(this._options.tmpdir, info.hostname || '');
    }
    return fs.createWriteStream(p, options);
  }

  async unlink(path: string): Promise<void> {
    let p = Path.join(this._options.root, path);
    return new Promise((resolve, reject) => {
      rimraf(p, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async mkdir(path: string, prefix?: boolean): Promise<void> {
    let p = Path.join(this._options.root, path);
    let parent = Path.dirname(path);
    if (prefix && parent !== '/') {
      // 递归
      try {
        let stat = await fs.stat(parent);
        if (!stat.isDirectory()) {
          await this.mkdir(parent, true);
        }
      } catch (e) {
        // 目录不存在
        await this.mkdir(parent, true);
      }
    }
    await fs.mkdir(p);
  }

  async readdir(path: string, recursion?: true | string): Promise<string[]> {
    if (recursion === true) {
      recursion = '**/*';
    }
    let pattern: string = recursion || '*';
    let p = Path.join(this._options.root, path);
    return await new Promise((resolve, reject) => {
      glob(pattern, {
        cwd: p
      }, (error, files) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(files);
      });
    });
  }

  async createUrl(path: string): Promise<string> {
    let { urlPrefix } = this._options;
    return urlPrefix + path;
  }

  async copy(path: string, dist: string): Promise<void> {
    // TODO copy dir
    let from = Path.join(this._options.root, path);
    let to = Path.join(this._options.root, dist);
    await fs.copyFile(from, to);
  }

  async rename(path: string, dist: string): Promise<void> {
    let from = Path.join(this._options.root, path);
    let to = Path.join(this._options.root, dist);
    await fs.rename(from, to);
  }

  async exists(path: string): Promise<boolean> {
    let p = Path.join(this._options.root, path);
    return await fs.exists(p);
  }

  async isFile(path: string): Promise<boolean> {
    let p = Path.join(this._options.root, path);
    try {
      let stat = await fs.stat(p);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    let p = Path.join(this._options.root, path);
    try {
      let stat = await fs.stat(p);
      return stat.isDirectory();
    } catch (e) {
      return false;
    }
  }

  async initMultipartUpload(path: string, partCount: number): Promise<string[]> {
    let taskId = 'upload-' + Math.random() + '-';
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push('part:' + taskId + i + path + '?' + i);
    }
    return files;
  }

  async writePart(path: string, partTask: string, data: stream$Readable): Promise<string> {
    let info = URL.parse(partTask);
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let writeStream = await this.createWriteStream(partTask);
    await new Promise((resolve, reject) => {
      data.pipe(writeStream).on('close', resolve).on('error', reject);
    });
    return partTask;
  }

  async completeMultipartUpload(path: string, parts: string[]): Promise<void> {
    let files = [];
    for (let part of parts) {
      if (!part.startsWith('part:')) {
        throw new Error(`${part} is not a part file`);
      }
      let info = URL.parse(part);
      if (!info.hostname) throw new Error('Invalid part link: ' + part);
      if (info.pathname !== path) throw new Error('Invalid part link: ' + part + ' for path: ' + path);
      let file = Path.join(this._options.tmpdir, info.hostname);
      if (!await fs.exists(file)) {
        throw new Error(`part file ${part} is not exists`);
      }
      files.push(file);
    }

    for (let file of files) {
      let stream = fs.createReadStream(file);
      await this.append(path, stream);
    }

    files.forEach((file) => fs.unlink(file));
  }
};
