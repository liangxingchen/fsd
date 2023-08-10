/// <reference types="node"/>

export interface DriverOptions {
  adapter: Adapter<any>;
}

export interface ReadStreamOptions {
  start?: number;
  end?: number;
}

export interface WriteStreamOptions {
  start?: number; // ! fsd-oss 不支持 start
}

export interface FileMetadata {
  size?: number;
  lastModified?: Date;
}

/**
 * 创建URL选项
 */
export interface CreateUrlOptions {
  /**
   * 文件路径，可选，适用于VOD驱动获取不同清晰度的视频播放地址
   */
  path?: string;
  /**
   * 缩略图规格名
   */
  thumb?: string;
  /**
   * 链接过期时间，单位秒，默认值 3600
   */
  expires?: number;
  /**
   * 链接响应头，可选
   */
  response?: {
    'content-type'?: string;
    'content-disposition'?: string;
  };
}

export interface WithPromise {
  promise?: Promise<any>;
}

export type Task = string;
export type Part = string;

/**
 * 文件对象
 */
export interface FSDFile {
  /**
   * 是否为FSDFile实例
   */
  readonly instanceOfFSDFile: true;
  /**
   * 文件路径，例如 /path/to/file.txt
   */
  readonly path: string;
  /**
   * 文件所在目录，例如 /path/to
   */
  readonly dir: string;
  /**
   * 文件名，包含扩展名，例如 file.txt
   */
  readonly base: string;
  /**
   * 文件名，不包含扩展名，例如 file
   */
  readonly name: string;
  /**
   * 文件扩展名，例如 .txt
   */
  readonly ext: string;
  /**
   * 是否需要确保目录存在
   */
  readonly needEnsureDir: boolean;

  /**
   * 给文件追加内容
   * @param {string|Buffer|NodeJS.ReadableStream} data 追加内容
   */
  append(data: string | Buffer | NodeJS.ReadableStream): Promise<void>;

  /**
   * 读取文件内容
   * @param {string} [encoding] 编码
   */
  read(encoding: BufferEncoding): Promise<string>;

  /**
   * 读取文件内容
   * @param {number} [position] 读取起始位置
   * @param {number} [length] 读取长度
   */
  read(position?: number, length?: number): Promise<Buffer>;

  /**
   * 读取文件内容
   * @param {number} position 读取起始位置
   * @param {number} length 读取长度
   * @param {string} encoding 编码
   */
  read(position: number, length: number, encoding: BufferEncoding): Promise<string>;

  /**
   * 写入文件内容
   * @param {string|Buffer|NodeJS.ReadableStream} [data] 写入内容
   */
  write(data?: string | Buffer | NodeJS.ReadableStream): Promise<void>;

  /**
   * 创建读取流
   * @param {object} options 读取流选项
   */
  createReadStream(options?: ReadStreamOptions): Promise<NodeJS.ReadableStream>;

  /**
   * 创建写入流
   * @param {object} options 写入流选项
   */
  createWriteStream(options?: WriteStreamOptions): Promise<NodeJS.WritableStream>;

  /**
   * 删除文件
   */
  unlink(): Promise<void>;

  /**
   * 新建目录
   * @param {boolean} [recursive] 是否递归创建
   */
  mkdir(recursive?: boolean): Promise<void>;

  /**
   * 读取目录
   * @param {boolean|string} [recursion] 是否递归读取，或者指定子目录glob规则
   */
  readdir(recursion?: true | string): Promise<FSDFile[]>;

  /**
   * 创建访问URL
   * @param {object} options 创建URL选项
   */
  createUrl(options?: CreateUrlOptions): Promise<string>;

  /**
   * 拷贝文件到目标路径
   * @param {string} dest 目标路径
   */
  copy(dest: string): Promise<FSDFile>;

  /**
   * 重命名文件到目标路径
   * @param {string} dest 目标路径
   */
  rename(dest: string): Promise<void>;

  /**
   * 判断文件是否存在
   */
  exists(): Promise<boolean>;

  /**
   * 判断文件是否为文件
   */
  isFile(): Promise<boolean>;

  /**
   * 判断文件是否为目录
   */
  isDirectory(): Promise<boolean>;

  /**
   * 获取文件大小
   */
  size(): Promise<number>;

  /**
   * 获取文件最后修改时间
   */
  lastModified(): Promise<Date>;

  /**
   * 创建分片上传任务
   * @param {number} partCount 分片数量
   */
  initMultipartUpload(partCount: number): Promise<Task[]>;

  /**
   * 上传分片数据
   * @param {string} partTask 分片任务ID
   * @param {any} data 分片数据
   * @param {number} [size] 分片大小
   */
  writePart(
    partTask: Task,
    data: string | Buffer | NodeJS.ReadableStream,
    size?: number
  ): Promise<Part>;
  completeMultipartUpload(parts: Part[]): Promise<void>;

  toString(): string;
  toJSON(): string;
}

/**
 * 文件分片选项
 */
export interface AllocOptions {
  path?: string;
  name?: string;
  size?: number;
  [key: string]: any;
}

export class Adapter<T> {
  readonly instanceOfFSDAdapter: true;
  readonly name: string;
  /**
   * 适配器是否需要确保文件夹存在
   * FS适配器如果父文件夹不存在会报错，而OSS适配器不会
   */
  readonly needEnsureDir: boolean;
  /**
   * 分配文件路径
   * Vod上传前必须调用此方法分配一个VideoID作为文件path，不能直接使用 fsd(path)
   */
  alloc?: (options?: AllocOptions) => Promise<string>;
  /**
   * 创建上传凭证，如果支持边缘上传，否则不存在
   * @param path 文件路径
   * @param {any} [meta] 文件元数据
   * @param {number} [durationSeconds] 令牌有效时长，单位秒
   */
  createUploadToken?: (path: string, meta?: any, durationSeconds?: number) => Promise<any>;

  constructor(options: T);
  append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void>;
  createReadStream(path: string, options?: ReadStreamOptions): Promise<NodeJS.ReadableStream>;
  createWriteStream(
    path: string,
    options?: WriteStreamOptions
  ): Promise<NodeJS.WritableStream & WithPromise>;
  unlink(path: string): Promise<void>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  readdir(
    path: string,
    recursion?: true | string | any
  ): Promise<Array<{ name: string; metadata?: FileMetadata }>>;
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
   * 此方法调用时可不必先调用initMultipartUpload，能直接使用其他File对象initMultipartUpload方法返回的Task
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

export interface FileGenerator {
  adapter: Adapter<any>;
  (path: string): FSDFile;
}

export default function FSD(options: DriverOptions): FileGenerator;
