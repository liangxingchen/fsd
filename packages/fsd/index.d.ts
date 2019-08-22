declare namespace FSD {
  interface DriverOptions {
    adapter: Adapter<any>;
  }

  interface ReadStreamOptions {
    start?: number;
    end?: number;
  }

  interface WriteStreamOptions {
    start?: number; // ! fsd-oss 不支持 start
  }

  interface FileMetadata {
    size?: number;
    lastModified?: Date;
  }

  interface CreateUrlOptions {
    expires?: number;
    response?: {
      'content-type'?: string;
      'content-disposition'?: string;
    };
  }

  type Task = string;
  type Part = string;

  class FSDFile {
    instanceOfFSDFile: true;
    path: string;
    dir: string;
    base: string;
    name: string;
    ext: string;
    needEnsureDir: boolean;
    append(data: string | Buffer | NodeJS.ReadableStream): Promise<void>;
    read(encoding: string): Promise<string>;
    read(position?: number, length?: number): Promise<Buffer>;
    read(position: number, length: number, encoding: string): Promise<string>;
    write(data?: string | Buffer | NodeJS.ReadableStream): Promise<void>;
    createReadStream(options?: ReadStreamOptions): Promise<NodeJS.ReadableStream>;
    createWriteStream(options?: WriteStreamOptions): Promise<NodeJS.WritableStream>;
    unlink(): Promise<void>;
    mkdir(prefix?: boolean): Promise<void>;
    readdir(recursion?: true | string): Promise<FSDFile[]>;
    createUrl(options?: CreateUrlOptions): Promise<string>;
    copy(dest: string): Promise<FSDFile>;
    rename(dest: string): Promise<void>;
    exists(): Promise<boolean>;
    isFile(): Promise<boolean>;
    isDirectory(): Promise<boolean>;
    size(): Promise<number>;
    lastModified(): Promise<Date>;
    initMultipartUpload(partCount: number): Promise<Task[]>;
    writePart(partTask: Task, data: string | Buffer | NodeJS.ReadableStream, size?: number): Promise<Part>;
    completeMultipartUpload(parts: Part[]): Promise<void>;
    toString(): string;
    toJSON(): string;
  }

  class Adapter<T> {
    instanceOfFSDAdapter: true;
    name: string;
    needEnsureDir: boolean;
    constructor(options: T);
    append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void>;
    createReadStream(path: string, options?: ReadStreamOptions): Promise<NodeJS.ReadableStream>;
    createWriteStream(path: string, options?: WriteStreamOptions): Promise<NodeJS.WritableStream>;
    unlink(path: string): Promise<void>;
    mkdir(path: string, prefix?: boolean): Promise<void>;
    readdir(path: string, recursion?: true | string | any): Promise<Array<{ name: string; metadata?: FileMetadata }>>;
    createUrl(path: string, options?: CreateUrlOptions): Promise<string>;
    copy(path: string, dest: string): Promise<void>;
    rename(path: string, dest: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    isFile(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;
    size(path: string): Promise<number>;
    lastModified(path: string): Promise<Date>;
    /**
     * 初始化一个多Part上传任务
     * @param {string} path 目标路径
     * @param {number} partCount Part数量
     */
    initMultipartUpload(path: string, partCount: number): Promise<Task[]>;
    /**
     * 上传Part
     * 次方法调用时可不必先调用initMultipartUpload，能直接使用其他File对象initMultipartUpload方法返回的Task
     * @param {string} path 目标路径
     * @param {Task} partTask Part任务
     * @param {Stream} data 数据流
     * @param {number} size 数据块大小
     */
    writePart(path: string, partTask: Task, data: NodeJS.ReadableStream, size: number): Promise<Part>;
    /**
     * 完成多Part上传
     * 此方法调用时可不必先调用writePart，能直接使用其他File对象writePart方法返回的Part
     * parts 参数顺序可以和initMultipartUpload返回的列表顺序不一样
     * @param {string} path 目标路径
     * @param {Part[]} parts
     */
    completeMultipartUpload(path: string, parts: Part[]): Promise<void>;
  }

  // eslint-disable-next-line @typescript-eslint/class-name-casing
  interface fsd {
    adapter: Adapter<any>;
    (path: string): FSDFile;
  }
}

// eslint-disable-next-line no-redeclare
declare function FSD(options: FSD.DriverOptions): FSD.fsd;

export = FSD;
