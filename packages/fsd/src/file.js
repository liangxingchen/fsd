// @Flow

import type { Adapter, Task, Part, FileMetadata } from 'fsd';

const Path = require('path');
const slash = require('slash');
const { PassThrough } = require('stream');
const isStream = require('is-stream');
const debug = require('debug')('fsd');

module.exports = class FSDFile {
  _adapter: Adapter;
  _size: number | null;
  _lastModified: Date | null;
  path: string;
  dir: string;
  base: string;
  name: string;
  ext: string;

  constructor(path: string | FSDFile, adapter: Adapter, metadata?: FileMetadata) {
    debug('initialize file %s', path);
    if (!path) throw new Error('FSD File must initialize with path');
    if (typeof path === 'object' && path.path) {
      ({ path } = path);
    }
    if (path[0] !== '/') {
      path = '/' + path;
    }
    this._adapter = adapter;
    this.path = path;
    let info = Path.parse(path);
    this.dir = info.dir;
    this.base = info.base;
    this.name = info.name;
    this.ext = info.ext;
    metadata = metadata || {};
    this._size = typeof metadata.size === 'number' ? metadata.size : null;
    this._lastModified = metadata.lastModified || null;
  }

  append(data: string | Buffer | stream$Readable): Promise<void> {
    debug('append %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('append failed, file path should not ends with /');
    }
    this._size = null;
    this._lastModified = null;
    return this._adapter.append(this.path, data);
  }

  async read(position?: number, length?: number, encoding?: string): Promise<Buffer | string> {
    debug('read %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('read failed, file path should not ends with /');
    }
    if (position && typeof position === 'string') {
      encoding = position;
      position = 0;
      length = 0;
    }
    let options = {};
    if (position || position === 0) {
      options.start = position;
    }
    if (length) {
      options.end = (position + length) - 1;
    }
    let stream = await this._adapter.createReadStream(this.path, options);
    return await new Promise((resolve, reject) => {
      let buffers = [];
      stream.on('error', reject);
      stream.on('data', (data) => buffers.push(data));
      stream.on('end', () => {
        let buf = Buffer.concat(buffers);
        if (encoding) {
          resolve(buf.toString(encoding));
        } else {
          resolve(buf);
        }
      });
    });
  }

  async write(data: string | Buffer | stream$Readable): Promise<void> {
    debug('write %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('write failed, file path should not ends with /');
    }
    this._size = null;
    this._lastModified = null;
    let stream = await this._adapter.createWriteStream(this.path);
    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      if (isStream.readable(data)) {
        data.pipe(stream);
      } else {
        stream.end(data);
      }
    });
  }

  createReadStream(options?: ReadStreamOptions): Promise<stream$Readable> {
    debug('createReadStream %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('createReadStream failed, file path should not ends with /');
    }
    return this._adapter.createReadStream(this.path, options);
  }

  createWriteStream(options?: WriteStreamOptions): Promise<stream$Writable> {
    debug('createWriteStream %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('createReadStream failed, file path should not ends with /');
    }
    this._size = null;
    this._lastModified = null;
    return this._adapter.createWriteStream(this.path, options);
  }

  unlink(): Promise<void> {
    debug('unlink %s', this.path);
    this._size = null;
    this._lastModified = null;
    return this._adapter.unlink(this.path);
  }

  mkdir(prefix?: boolean): Promise<void> {
    debug('mkdir %s', this.path);
    /* istanbul ignore if */
    if (!this.path.endsWith('/')) {
      throw new Error('mkdir failed, directory path should be ends with /');
    }
    this._size = null;
    this._lastModified = null;
    return this._adapter.mkdir(this.path, prefix);
  }

  async readdir(recursion?: true | string): Promise<FSDFile[]> {
    debug('readdir %s', this.path);
    /* istanbul ignore if */
    if (!this.path.endsWith('/')) {
      throw new Error('readdir failed, directory path should be ends with /');
    }
    let files = await this._adapter.readdir(this.path, recursion);
    return files.map(({ name, metadata }) => new FSDFile(slash(Path.join(this.path, name)), this._adapter, metadata));
  }

  createUrl(): Promise<string> {
    debug('createUrl %s', this.path);
    return this._adapter.createUrl(this.path);
  }

  async copy(dest: string): Promise<FSDFile> {
    debug('copy %s to %s', this.path, dest);
    if (!Path.isAbsolute(dest)) {
      dest = slash(Path.join(Path.dirname(this.path), dest));
    }
    /* istanbul ignore if */
    if (dest === this.path) {
      throw new Error('copy failed, dest path should not equal to source path');
    }
    /* istanbul ignore if */
    if (this.path.endsWith('/') && !dest.endsWith('/')) {
      throw new Error('copy failed, dest path should be ends with /');
      /* istanbul ignore if */
    } else if (!this.path.endsWith('/') && dest.endsWith('/')) {
      throw new Error('copy failed, dest path should not ends with /');
    }
    await this._adapter.copy(this.path, dest);
    return new FSDFile(dest, this._adapter);
  }

  rename(dest: string): Promise<void> {
    debug('rename %s to %s', this.path, dest);
    /* istanbul ignore if */
    if (dest === this.path) {
      throw new Error('rename failed, dest path should not equal to source path');
    }
    /* istanbul ignore if */
    if (this.path.endsWith('/') && !dest.endsWith('/')) {
      throw new Error('copy failed, dest path should be ends with /');
      /* istanbul ignore if */
    } else if (!this.path.endsWith('/') && dest.endsWith('/')) {
      throw new Error('copy failed, dest path should not ends with /');
    }
    this._size = null;
    this._lastModified = null;
    return this._adapter.rename(this.path, dest);
  }

  exists(): Promise<boolean> {
    debug('check exists %s', this.path);
    return this._adapter.exists(this.path);
  }

  isFile(): Promise<boolean> {
    debug('check is file %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('isFile failed, file path should not ends with /');
    }
    return this._adapter.isFile(this.path);
  }

  isDirectory(): Promise<boolean> {
    debug('check is directory %s', this.path);
    /* istanbul ignore if */
    if (!this.path.endsWith('/')) {
      throw new Error('isDirectory failed, file path should be ends with /');
    }
    return this._adapter.isDirectory(this.path);
  }

  async size(): Promise<number> {
    if (this.path.endsWith('/')) return 0;
    if (typeof this._size !== 'number') {
      this._size = await this._adapter.size(this.path);
    }
    return this._size;
  }

  async lastModified(): Promise<Date> {
    if (!this._lastModified) {
      this._lastModified = await this._adapter.lastModified(this.path);
    }
    return this._lastModified;
  }

  async initMultipartUpload(partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', this.path, partCount);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('initMultipartUpload failed, file path should not ends with /');
    }
    return this._adapter.initMultipartUpload(this.path, partCount);
  }

  writePart(task: Task, data: string | Buffer | stream$Readable, size?: number): Promise<Part> {
    debug('writePart %s, task: %s', this.path, task);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('writePart failed, file path should not ends with /');
    }
    /* istanbul ignore if */
    if (!task.startsWith('task:')) throw new Error('Invalid task link');
    let stream: stream$Readable = data;
    if (!isStream.readable(data)) {
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      size = data.length;
      stream = new PassThrough();
      stream.end(data);
    }
    return this._adapter.writePart(this.path, task, stream, size);
  }

  completeMultipartUpload(parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', this.path);
    /* istanbul ignore if */
    if (this.path.endsWith('/')) {
      throw new Error('completeMultipartUpload failed, file path should not ends with /');
    }
    this._size = null;
    this._lastModified = null;
    return this._adapter.completeMultipartUpload(this.path, parts);
  }

  toString() {
    return this.path;
  }

  toJSON() {
    return this.path;
  }
};
