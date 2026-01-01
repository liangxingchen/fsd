import os from 'os';
import Path from 'path';
import fs from 'fs';
import isStream from 'is-stream';
import { glob } from 'glob';
import mapLimit from 'async/mapLimit';
import Debugger from 'debug';
import type { ReadStreamOptions, WriteStreamOptions, Task, Part, FileMetadata } from 'fsd';
import type { FSAdapterOptions } from 'fsd-fs';

const debug = Debugger('fsd-fs');

async function getStat(path: string) {
  try {
    return await fs.promises.stat(path);
  } catch (_e) {
    return null;
  }
}

export default class FSAdapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
  _options: FSAdapterOptions;

  constructor(options: FSAdapterOptions) {
    this.instanceOfFSDAdapter = true;
    this.name = 'FSAdapter';
    this.needEnsureDir = true;
    this._options = Object.assign(
      {
        urlPrefix: '',
        root: '/',
        mode: 0o666,
        tmpdir: os.tmpdir()
      },
      options
    );
    let { urlPrefix } = this._options;
    if (urlPrefix.endsWith('/')) {
      urlPrefix = urlPrefix.substr(0, urlPrefix.length - 1);
      this._options.urlPrefix = urlPrefix;
    }
  }

  async append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    debug('append %s', path);
    let { root, mode } = this._options;
    let p = Path.join(root, path);
    if (isStream.readable(data)) {
      let stream: NodeJS.ReadableStream = data;
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
    await fs.promises.appendFile(p, data as string | Buffer, { mode });
  }

  async createReadStream(
    path: string,
    options?: ReadStreamOptions
  ): Promise<NodeJS.ReadableStream> {
    debug('createReadStream %s options: %o', path, options);
    let p = Path.join(this._options.root, path);
    return fs.createReadStream(p, options);
  }

  async createWriteStream(
    path: string,
    options?: WriteStreamOptions
  ): Promise<NodeJS.WritableStream> {
    debug('createWriteStream %s', path);
    let p: string;
    if (path.startsWith('task://')) {
      p = Path.join(this._options.tmpdir, path.replace('task://', ''));
    } else {
      p = Path.join(this._options.root, path);
    }
    return fs.createWriteStream(p, options);
  }

  async unlink(path: string): Promise<void> {
    debug('unlink %s', path);
    let p = Path.join(this._options.root, path);
    await fs.promises.rm(p, { recursive: true, force: true });
  }

  async mkdir(path: string, recursive?: boolean): Promise<void> {
    debug('mkdir %s', path);
    let fsPath = Path.join(this._options.root, path);
    await fs.promises.mkdir(fsPath, { recursive });
  }

  async readdir(
    path: string,
    recursion?: true | string
  ): Promise<Array<{ name: string; metadata?: FileMetadata }>> {
    debug('readdir %s', path);
    if (recursion === true) {
      recursion = '**/*';
    }
    let pattern: string = recursion || '*';
    let p = Path.join(this._options.root, path);
    let files = await glob(pattern, {
      cwd: p
    });
    files.reverse();
    return await mapLimit<string, { name: string; metadata?: FileMetadata }>(
      files,
      20,
      async (name: string) => {
        let filePath = Path.join(p, name);
        let stat = await getStat(filePath);
        let isDir = stat.isDirectory();
        return {
          name: isDir ? `${name}/` : name,
          metadata: {
            size: isDir ? 0 : stat.size,
            lastModified: stat.mtime
          }
        };
      }
    );
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
    if (!(await getStat(from))) throw new Error(`source file '${path}' is not exists!`);
    await fs.promises.cp(from, to, { recursive: true, force: true });
  }

  async rename(path: string, dest: string): Promise<void> {
    debug('rename %s to %s', path, dest);
    let from = Path.join(this._options.root, path);
    let to = Path.join(this._options.root, dest);
    await fs.promises.rename(from, to);
  }

  async exists(path: string): Promise<boolean> {
    debug('check exists %s', path);
    let p = Path.join(this._options.root, path);
    return !!(await getStat(p));
  }

  async isFile(path: string): Promise<boolean> {
    debug('check is file %s', path);
    let p = Path.join(this._options.root, path);
    let stat = await getStat(p);
    return stat?.isFile();
  }

  async isDirectory(path: string): Promise<boolean> {
    debug('check is directory %s', path);
    let p = Path.join(this._options.root, path);
    let stat = await getStat(p);
    return stat?.isDirectory();
  }

  async size(path: string): Promise<number> {
    debug('get file size %s', path);
    let p = Path.join(this._options.root, path);
    let stat = await getStat(p);
    return stat.size;
  }

  async lastModified(path: string): Promise<Date> {
    debug('get file lastModified %s', path);
    let p = Path.join(this._options.root, path);
    let stat = await getStat(p);
    return stat.mtime;
  }

  async initMultipartUpload(path: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', path, partCount);
    let taskId = `upload-${Math.random().toString().substring(2)}-`;
    let tasks = [];
    for (let i = 1; i <= partCount; i += 1) {
      tasks.push(`task://${taskId}${i}`);
    }
    return tasks;
  }

  async writePart(path: string, partTask: Task, data: NodeJS.ReadableStream): Promise<Part> {
    debug('writePart %s, task: %s', path, partTask);
    if (!partTask.startsWith('task://')) throw new Error('Invalid part task id');
    let writeStream = await this.createWriteStream(partTask);
    await new Promise((resolve, reject) => {
      data.pipe(writeStream).on('close', resolve).on('error', reject);
    });
    return partTask.replace('task://', 'part://');
  }

  async completeMultipartUpload(path: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', path);
    let partPaths = [];
    for (let part of parts) {
      /* istanbul ignore if */
      if (!part.startsWith('part://')) throw new Error(`${part} is not a part file`);
      let partPath = Path.join(this._options.tmpdir, part.replace('part://', ''));
      /* istanbul ignore if */
      let stat = await getStat(partPath);
      if (!stat) throw new Error(`part file ${part} is not exists`);
      partPaths.push({ file: partPath, size: stat.size });
    }

    let p = Path.join(this._options.root, path);

    let start = 0;
    for (let info of partPaths) {
      let writeStream = fs.createWriteStream(p, {
        flags: 'a',
        start
      });
      let stream = fs.createReadStream(info.file);
      await new Promise((resolve, reject) => {
        stream.pipe(writeStream).on('close', resolve).on('error', reject);
      });
      start += info.size;
      writeStream.close();
    }

    partPaths.forEach((info) => fs.promises.rm(info.file, { force: true }));
  }
}
