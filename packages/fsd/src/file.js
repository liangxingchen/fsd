// @Flow

import type { Adapter } from 'fsd';

const Path = require('path');
const isStream = require('is-stream');

module.exports = class FSDFile {
  _adapter: Adapter;
  path: string;
  dir: string;
  base: string;
  name: string;
  ext: string;

  constructor(path: string, adapter: Adapter) {
    this._adapter = adapter;
    this.path = path;
    let info = Path.parse(path);
    this.dir = info.dir;
    this.base = info.base;
    this.name = info.name;
    this.ext = info.ext;
  }

  append(data: string | Buffer | stream$Readable): Promise<void> {
    return this._adapter.append(this.path, data);
  }

  async read(position?: number, length?: number, encoding?: string): Promise<Buffer | string> {
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

  write(data: string | Buffer | stream$Readable): Promise<void> {
    return this._write(this.path, data);
  }

  async _write(path: string, data: string | Buffer | stream$Readable): Promise<void> {
    let stream = await this._adapter.createWriteStream(path);
    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('close', resolve);
      if (isStream.readable(data)) {
        data.pipe(stream);
      } else {
        stream.end(data);
      }
    });
  }

  createReadStream(options?: ReadStreamOptions): Promise<stream$Readable> {
    return this._adapter.createReadStream(this.path, options);
  }

  createWriteStream(options?: WriteStreamOptions): Promise<stream$Writable> {
    return this._adapter.createWriteStream(this.path, options);
  }

  unlink(): Promise<void> {
    return this._adapter.unlink(this.path);
  }

  mkdir(prefix?: boolean): Promise<void> {
    return this._adapter.mkdir(this.path, prefix);
  }

  async readdir(recursion?: true | string): Promise<FSDFile[]> {
    let files = await this._adapter.readdir(this.path, recursion);
    return files.map((file) => new FSDFile(file));
  }

  createUrl(): Promise<string> {
    return this._adapter.createUrl(this.path);
  }

  copy(dist: string): Promise<FSDFile> {
    return this._adapter.copy(this.path, dist);
  }

  rename(dist: string): Promise<void> {
    return this._adapter.rename(this.path, dist);
  }

  exists(): Promise<boolean> {
    return this._adapter.exists(this.path);
  }

  isFile(): Promise<boolean> {
    return this._adapter.isFile(this.path);
  }

  isDirectory(): Promise<boolean> {
    return this._adapter.isDirectory(this.path);
  }

  async initMultipartUpload(partCount: number): Promise<string[]> {
    return this._adapter.initMultipartUpload(this.path, partCount);
  }

  writePart(part: string, data: string | Buffer | stream$Readable): Promise<void> {
    if (!part.startsWith('part:')) throw new Error('Invalid part link');
    return this._write(part, data);
  }

  completeMultipartUpload(parts: string[]): Promise<void> {
    return this._adapter.completeMultipartUpload(this.path, parts);
  }

  toString() {
    return this.path;
  }

  toJSON() {
    return this.path;
  }
};
