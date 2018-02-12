//@flow

import type { ReadStreamOptions, WriteStreamOptions, FSAdapterOptions } from 'fsd';

const util = require('util');
const os = require('os');
const URL = require('url');
const Path = require('path');
const fs = require('mz/fs');
const isStream = require('is-stream');
const glob = util.promisify(require('glob'));
const rimraf = util.promisify(require('rimraf'));
const cpr = util.promisify(require('cpr'));
const debug = require('debug')('fsd-fs');

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
    debug('append %s', path);
    let { root, mode } = this._options;
    let p = Path.join(root, path);
    if (isStream.readable(data)) {
      // $Flow
      let stream: stream$Readable = data;
      await new Promise((resolve, reject) => {
        fs.stat(p, (error, stat) => {
          let start = error ? 0 : stat.size;
          let writeStream = fs.createWriteStream(p, {
            flags: 'a',
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
    debug('createReadStream %s options: %o', path, options);
    let p = Path.join(this._options.root, path);
    return fs.createReadStream(p, options);
  }

  async createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable> {
    debug('createWriteStream %s', path);
    let p = Path.join(this._options.root, path);
    if (path.startsWith('part:')) {
      let info = URL.parse(path);
      /* istanbul ignore if */
      if (!info.pathname) throw new Error('Invalid part pathname');
      p = Path.join(this._options.tmpdir, info.hostname || '');
    }
    return fs.createWriteStream(p, options);
  }

  async unlink(path: string): Promise<void> {
    debug('unlink %s', path);
    let p = Path.join(this._options.root, path);
    await rimraf(p);
  }

  async mkdir(path: string, prefix?: boolean): Promise<void> {
    debug('mkdir %s', path);
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
    debug('readdir %s', path);
    if (recursion === true) {
      recursion = '**/*';
    }
    let pattern: string = recursion || '*';
    let p = Path.join(this._options.root, path);
    return await glob(pattern, {
      cwd: p
    });
  }

  async createUrl(path: string): Promise<string> {
    debug('createUrl %s', path);
    let { urlPrefix } = this._options;
    return urlPrefix + path;
  }

  async copy(path: string, dest: string): Promise<void> {
    debug('copy %s to %s', path, dest);
    const { root } = this._options;
    let from = Path.join(root, path);
    let to = Path.join(root, dest);
    /* istanbul ignore if */
    if (!await fs.exists(from)) throw new Error(`source file '${path}' is not exists!`);
    /* istanbul ignore if */
    if (await fs.exists(to)) throw new Error(`dest file '${dest}' is already exists!`);
    await cpr(from, to);
  }

  async rename(path: string, dest: string): Promise<void> {
    debug('rename %s to %s', path, dest);
    let from = Path.join(this._options.root, path);
    let to = Path.join(this._options.root, dest);
    await fs.rename(from, to);
  }

  async exists(path: string): Promise<boolean> {
    debug('check exists %s', path);
    let p = Path.join(this._options.root, path);
    return await fs.exists(p);
  }

  async isFile(path: string): Promise<boolean> {
    debug('check is file %s', path);
    let p = Path.join(this._options.root, path);
    try {
      let stat = await fs.stat(p);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    debug('check is directory %s', path);
    let p = Path.join(this._options.root, path);
    try {
      let stat = await fs.stat(p);
      return stat.isDirectory();
    } catch (e) {
      return false;
    }
  }

  async initMultipartUpload(path: string, partCount: number): Promise<string[]> {
    debug('initMultipartUpload %s, partCount: %d', path, partCount);
    let taskId = 'upload-' + Math.random().toString().substr(2) + '-';
    let tasks = [];
    for (let i = 1; i <= partCount; i += 1) {
      tasks.push('part:' + taskId + i + path + '?' + i);
    }
    return tasks;
  }

  async writePart(path: string, partTask: string, data: stream$Readable): Promise<string> {
    debug('writePart %s, task: %s', path, partTask);
    let info = URL.parse(partTask);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== path) throw new Error('Invalid part pathname');
    let writeStream = await this.createWriteStream(partTask);
    await new Promise((resolve, reject) => {
      data.pipe(writeStream).on('close', resolve).on('error', reject);
    });
    return partTask;
  }

  async completeMultipartUpload(path: string, parts: string[]): Promise<void> {
    debug('completeMultipartUpload %s', path);
    let files = [];
    for (let part of parts) {
      /* istanbul ignore if */
      if (!part.startsWith('part:')) throw new Error(`${part} is not a part file`);
      let info = URL.parse(part);
      /* istanbul ignore if */
      if (!info.hostname) throw new Error('Invalid part link: ' + part);
      /* istanbul ignore if */
      if (info.pathname !== path) throw new Error('Invalid part link: ' + part + ' for path: ' + path);
      let file = Path.join(this._options.tmpdir, info.hostname);
      /* istanbul ignore if */
      if (!await fs.exists(file)) throw new Error(`part file ${part} is not exists`);
      files.push(file);
    }

    for (let file of files) {
      let stream = fs.createReadStream(file);
      await this.append(path, stream);
    }

    files.forEach((file) => fs.unlink(file));
  }
};
