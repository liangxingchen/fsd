declare module fsd {
  declare interface DriverOptions {
    adapter: Adapter;
  }

  declare interface FSAdapterOptions {
    root: string;
    mode: number;
    urlPrefix: string;
    tmpdir: string;
  }

  declare interface OSSAdapterOptions {
    root: string;
    urlPrefix: string;
    keyId: string;
    secret: string;
    bucket: string;
    endpoint: string;
  }

  declare interface ReadStreamOptions {
  }

  declare interface WriteStreamOptions {
  }

  declare class FSDFile {
    +path: string;
    +dir: string;
    +base: string;
    +name: string;
    +ext: string;
    append(data: string | Buffer | stream$Readable): Promise<void>;
    read(encoding: string): Promise<string>;
    read(position?: number, length?: number): Promise<Buffer>;
    read(position: number, length: number, encoding: string): Promise<string>;
    write(data: string | Buffer | stream$Readable): Promise<void>;
    createReadStream(options?: ReadStreamOptions): Promise<stream$Readable>;
    createWriteStream(options?: WriteStreamOptions): Promise<stream$Writable>;
    unlink(): Promise<void>;
    mkdir(prefix?: boolean): Promise<void>;
    readdir(recursion?: true | string): Promise<FSDFile[]>;
    createUrl(): Promise<string>;
    copy(dist: string): Promise<FSDFile>;
    rename(dist: string): Promise<void>;
    exists(): Promise<boolean>;
    isFile(): Promise<boolean>;
    isDirectory(): Promise<boolean>;
    initMultipartUpload(partCount: number): Promise<string[]>;
    writePart(part: string, data: string | Buffer | stream$Readable): Promise<void>;
    completeMultipartUpload(parts: string[]): Promise<void>;
    toString(): string;
    toJSON(): string;
  }

  declare class Adapter {
    constructor(options: Object): void;
    append(path: string, data: string | Buffer | stream$Readable): Promise<void>;
    createReadStream(path: string, options?: ReadStreamOptions): Promise<stream$Readable>;
    createWriteStream(path: string, options?: WriteStreamOptions): Promise<stream$Writable>;
    unlink(path: string): Promise<void>;
    mkdir(path: string, prefix?: boolean): Promise<void>;
    readdir(path: string, recursion?: true | string | Object): Promise<string[]>;
    createUrl(path: string): Promise<string>;
    copy(path: string, dist: string): Promise<string>;
    rename(path: string, dist: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    isFile(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;
    initMultipartUpload(path: string, partCount: number): Promise<string[]>;
    completeMultipartUpload(path: string, parts: string[]): Promise<void>;
  }

  declare function fsd(path: string | FSDFile): FSDFile;

  declare function FSD(options: DriverOptions): fsd;

  declare module .exports: FSD
}
