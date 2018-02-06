declare module fsd {
  declare interface DriverOptions {
    adaptor: 'fs' | 'oss';
    fs?: FSOptions;
    oss?: OSSOptions;
  }

  declare interface FSOptions {
  }

  declare interface OSSOptions {
  }

  declare type AdaptorOptions = FSOptions | OSSOptions;

  declare function FSD(options: DriverOptions): fsd;

  declare function fsd(path: string | FSDFile): FSDFile;

  declare class FSDFile {
    +path: string;
    +dir: string;
    +name: string;
    +ext: string;
    +part: boolean;
    +partId: number;
    +partCache: string;
    append(data: string | Buffer): Promise<void>;
    read(position?: number | null, length?: number): Promise<Buffer>;
    write(data: string | Buffer | stream$Readable): Promise<void>;
    write(position: number | null, data: string | Buffer | stream$Readable): Promise<void>;
    unlink(): Promise<void>;
    createReadStream(options?: Object): Promise<stream$Readable>;
    createWriteStream(options?: Object): Promise<stream$Writable>;
    mkdir(prefix?: boolean): Promise<void>;
    readdir(recursion?: true | string | Object): Promise<FSDFile[]>;
    createUrl(): Promise<string>;
    copy(dist: string): Promise<FSDFile>;
    exists(): Promise<boolean>;
    isFile(): Promise<boolean>;
    isDirectory(): Promise<boolean>;
    initMultipartUpload(partCount: number): Promise<FSDFile[]>;
    completeMultipartUpload(parts: FSDFile[]): Promise<void>;
  }

  declare class Adaptor {
    constructor(options: AdaptorOptions): void;
    // TODO
  }

  declare module .exports: FSD
}
