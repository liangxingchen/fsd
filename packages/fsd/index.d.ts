/// <reference types="node"/>

/**
 * FSD (File System Driver) - 核心库类型定义
 *
 * 这是一个通用的文件存储驱动抽象层，提供统一的 API 接口，
 * 支持多种存储后端（本地磁盘、阿里云 OSS、阿里云 VOD）。
 *
 * @packageDocumentation
 */

/**
 * FSD 工厂函数配置选项
 *
 * @example
 * ```typescript
 * const fsd = FSD({
 *   adapter: new FSAdapter({ root: '/uploads' })
 * });
 * ```
 */
export interface DriverOptions {
  /**
   * 存储适配器实例
   *
   * 适配器负责实际与底层存储系统交互（如本地文件系统、云存储等）。
   * 所有适配器必须实现 Adapter 接口。
   *
   * @example
   * ```typescript
   * // 本地文件系统适配器
   * import FSAdapter from 'fsd-fs';
   * const adapter = new FSAdapter({ root: '/uploads' });
   *
   * // 阿里云 OSS 适配器
   * import OSSAdapter from 'fsd-oss';
   * const adapter = new OSSAdapter({
   *   accessKeyId: 'xxx',
   *   accessKeySecret: 'xxx',
   *   region: 'oss-cn-hangzhou',
   *   bucket: 'my-bucket'
   * });
   *
   * // 阿里云 VOD 适配器
   * import VODAdapter from 'fsd-vod';
   * const adapter = new VODAdapter({
   *   accessKeyId: 'xxx',
   *   accessKeySecret: 'xxx',
   *   privateKey: 'xxx'
   * });
   * ```
   */
  adapter: Adapter<any>;
}

/**
 * 创建可读流的选项
 *
 * 用于控制流式读取文件时的起始位置和结束位置。
 */
export interface ReadStreamOptions {
  /**
   * 开始读取的字节位置（从 0 开始）
   *
   * @example
   * ```typescript
   * // 从第 100 字节开始读取
   * const stream = await file.createReadStream({ start: 100 });
   * ```
   *
   * @remarks
   * 注意：fsd-oss 适配器不支持此选项
   */
  start?: number;

  /**
   * 结束读取的字节位置（包含）
   *
   * @example
   * ```typescript
   * // 读取第 100 到 199 字节
   * const stream = await file.createReadStream({ start: 100, end: 199 });
   * ```
   */
  end?: number;
}

/**
 * 创建可写流的选项
 *
 * 用于控制流式写入文件时的起始位置。
 */
export interface WriteStreamOptions {
  /**
   * 开始写入的字节位置（从 0 开始）
   *
   * @example
   * ```typescript
   * // 从第 100 字节开始写入
   * const stream = await file.createWriteStream({ start: 100 });
   * ```
   *
   * @remarks
   * 注意：fsd-oss 和 fsd-vod 适配器不支持此选项
   */
  start?: number;
}

/**
 * 文件元数据
 *
 * 包含文件的基本信息，如大小和最后修改时间。
 * 这些信息通常在文件查询时返回，用于缓存和优化。
 */
export interface FileMetadata {
  /**
   * 文件大小（字节）
   *
   * 目录始终返回 0 或 undefined。
   */
  size?: number;

  /**
   * 文件最后修改时间
   *
   * 不同存储后端的精度可能不同。
   */
  lastModified?: Date;
}

/**
 * 创建访问 URL 的选项
 *
 * 用于生成临时访问链接，适用于文件下载、预览等场景。
 *
 * @example
 * ```typescript
 * // 创建 1 小时后过期的下载链接
 * const url = await file.createUrl({ expires: 3600 });
 *
 * // 创建带自定义响应头的下载链接
 * const url = await file.createUrl({
 *   expires: 7200,
 *   response: {
 *     'content-disposition': 'attachment; filename="report.pdf"'
 *   }
 * });
 *
 * // VOD 适配器：获取不同清晰度的视频播放地址
 * const url = await file.createUrl({
 *   path: '/video/HD',
 *   expires: 3600
 * });
 * ```
 */
export interface CreateUrlOptions {
  /**
   * 文件路径，可选
   *
   * 主要用于 VOD 驱动获取不同清晰度的视频播放地址。
   * 例如：'/video/HD' 表示高清版本，'/video/SD' 表示标清版本。
   */
  path?: string;

  /**
   * 缩略图规格名
   *
   * 用于 OSS/VOD 获取特定规格的缩略图 URL。
   * 具体规格名需要根据云服务商的配置而定。
   */
  thumb?: string;

  /**
   * 链接过期时间（秒）
   *
   * 默认值：3600（1 小时）
   *
   * @example
   * ```typescript
   * // 创建 10 分钟后过期的链接
   * const url = await file.createUrl({ expires: 600 });
   * ```
   */
  expires?: number;

  /**
   * 链接响应头（可选）
   *
   * 用于控制下载时的浏览器行为。
   *
   * @example
   * ```typescript
   * const url = await file.createUrl({
   *   response: {
   *     'content-type': 'application/pdf',
   *     'content-disposition': 'attachment; filename="document.pdf"'
   *   }
   * });
   * ```
   */
  response?: {
    /**
     * 响应的 Content-Type
     */
    'content-type'?: string;

    /**
     * 响应的 Content-Disposition
     *
     * 常用值：
     * - 'inline' - 在浏览器中预览
     * - 'attachment; filename="xxx"' - 强制下载并指定文件名
     */
    'content-disposition'?: string;
  };
}

/**
 * 带有 Promise 属性的可写流
 *
 * 某些适配器的可写流会附加一个 promise 属性，
 * 用于等待流写入完成。
 */
export interface WithPromise {
  /**
   * 流完成时的 Promise
   *
   * 如果存在此属性，可以 await 它来等待流写入完成。
   *
   * @example
   * ```typescript
   * const stream = await file.createWriteStream();
   * if (stream.promise) {
   *   await stream.promise;
   * }
   * ```
   */
  promise?: Promise<any>;
}

/**
 * 分片上传任务 ID
 *
 * 格式：`task:{number}` 或 `task://{UploadId}?{partNumber}`
 *
 * - `task:1` - 简单任务 ID（核心实现）
 * - `task://abc123?1` - 适配器特定的任务 ID（包含 UploadId 和分片号）
 *
 * @example
 * ```typescript
 * const tasks = await file.initMultipartUpload(3);
 * // tasks = ['task://uploadId123?1', 'task://uploadId123?2', 'task://uploadId123?3']
 * ```
 */
export type Task = string;

/**
 * 分片上传的分片信息
 *
 * 格式：`part://{UploadId}?{partNumber}#{etag}`
 *
 * 上传分片后会返回包含 ETag 的分片信息，用于完成分片上传。
 *
 * @example
 * ```typescript
 * const part = await file.writePart(task, data);
 * // part = 'part://uploadId123?1#d41d8cd98f00b204e9800998ecf8427e'
 * ```
 */
export type Part = string;

/**
 * FSD 文件对象
 *
 * FSDFile 是文件和目录操作的抽象层，提供统一的 API。
 * 通过工厂函数 `FSD({ adapter })()` 创建文件对象实例。
 *
 * @remarks
 * ### 路径约定（重要）
 * - **文件路径**必须**以 `/` 结尾**（例如 `/uploads/`）
 * - **文件路径**不能**以 `/` 结尾**（例如 `/file.txt`）
 * - 所有路径会自动补全前导 `/`
 *
 * ### 路径验证
 * 违反路径约定会抛出错误，例如：
 * - `await fsd('/file/').read()` → Error: file path should not ends with /
 * - `await fsd('/uploads').mkdir()` → Error: directory path should be ends with /
 *
 * ### 所有方法都是异步的
 * 所有操作都返回 Promise，必须使用 await。
 *
 * @example
 * ```typescript
 * import FSD from 'fsd';
 * import FSAdapter from 'fsd-fs';
 *
 * const fsd = FSD({ adapter: new FSAdapter({ root: '/uploads' }) });
 *
 * // 创建文件
 * const file = fsd('/test.txt');
 * await file.write('Hello, FSD!');
 *
 * // 读取文件
 * const content = await file.read('utf8');
 * console.log(content); // 'Hello, FSD!'
 *
 * // 创建目录
 * const dir = fsd('/photos/');
 * await dir.mkdir();
 *
 * // 列出目录
 * const files = await dir.readdir();
 * for (const f of files) {
 *   console.log(f.name);
 * }
 * ```
 */
export interface FSDFile {
  /**
   * 类型守卫：是否为 FSDFile 实例
   *
   * 用于运行时检查一个对象是否是 FSDFile 实例。
   *
   * @example
   * ```typescript
   * if (obj.instanceOfFSDFile) {
   *   console.log('This is an FSDFile');
   * }
   * ```
   */
  readonly instanceOfFSDFile: true;

  /**
   * 完整的文件路径
   *
   * 格式：绝对路径，前导 `/` 结尾取决于是文件还是目录
   *
   * @example
   * ```typescript
   * const file = fsd('/path/to/file.txt');
   * console.log(file.path); // '/path/to/file.txt'
   *
   * const dir = fsd('/path/to/folder/');
   * console.log(dir.path); // '/path/to/folder/'
   * ```
   */
  readonly path: string;

  /**
   * 文件所在目录路径
   *
   * 格式：以 `/` 结尾的目录路径
   *
   * @example
   * ```typescript
   * const file = fsd('/a/b/c.txt');
   * console.log(file.dir); // '/a/b/'
   *
   * const dir = fsd('/a/b/');
   * console.log(dir.dir); // '/a/b/'
   * ```
   */
  readonly dir: string;

  /**
   * 文件名（包含扩展名）
   *
   * @example
   * ```typescript
   * const file = fsd('/path/to/document.pdf');
   * console.log(file.base); // 'document.pdf'
   *
   * const dir = fsd('/path/to/folder/');
   * console.log(dir.base); // 'folder/'
   * ```
   */
  readonly base: string;

  /**
   * 文件名（不包含扩展名）
   *
   * @example
   * ```typescript
   * const file = fsd('/path/to/document.pdf');
   * console.log(file.name); // 'document'
   *
   * const file = fsd('/archive.tar.gz');
   * console.log(file.name); // 'archive.tar'
   * ```
   */
  readonly name: string;

  /**
   * 文件扩展名（包含点号）
   *
   * @example
   * ```typescript
   * const file = fsd('/path/to/document.pdf');
   * console.log(file.ext); // '.pdf'
   *
   * const file = fsd('/path/to/data.json');
   * console.log(file.ext); // '.json'
   * ```
   */
  readonly ext: string;

  /**
   * 是否需要确保目录存在
   *
   * 从适配器继承的属性：
   * - `true`: 需要先创建目录（FSAdapter）
   * - `false`: 自动处理目录（OSSAdapter, VODAdapter）
   *
   * @example
   * ```typescript
   * const file = fsd('/uploads/file.txt');
   * if (file.needEnsureDir) {
   *   await fsd('/uploads/').mkdir();
   * }
   * ```
   */
  readonly needEnsureDir: boolean;

  /**
   * 向文件追加内容
   *
   * 如果文件不存在会自动创建，如果文件存在则追加到末尾。
   *
   * @param data - 要追加的内容，可以是字符串、Buffer 或可读流
   *
   * @example
   * ```typescript
   * // 追加字符串
   * await file.append('Hello\n');
   *
   * // 追加 Buffer
   * await file.append(Buffer.from('World'));
   *
   * // 从其他文件追加
   * const source = fsd('/source.txt');
   * const dest = fsd('/dest.txt');
   * const sourceStream = await source.createReadStream();
   * await dest.append(sourceStream);
   * ```
   */
  append(data: string | Buffer | NodeJS.ReadableStream): Promise<void>;

  /**
   * 读取文件内容（带编码）
   *
   * @param encoding - 文本编码，如 'utf8', 'base64', 'ascii'
   * @returns 解码后的字符串内容
   *
   * @example
   * ```typescript
   * // 读取为 UTF-8 字符串
   * const text = await file.read('utf8');
   * console.log(text);
   *
   * // 读取为 Base64
   * const base64 = await file.read('base64');
   * console.log(base64);
   * ```
   */
  read(encoding: BufferEncoding): Promise<string>;

  /**
   * 读取文件内容（完整 Buffer）
   *
   * @returns 包含文件完整内容的 Buffer
   *
   * @example
   * ```typescript
   * const buffer = await file.read();
   * console.log(buffer.length); // 文件字节数
   * ```
   */
  read(position?: number, length?: number): Promise<Buffer>;

  /**
   * 读取文件内容（指定位置和长度，带编码）
   *
   * @param position - 读取起始字节位置（从 0 开始）
   * @param length - 读取的字节数
   * @param encoding - 文本编码
   * @returns 指定范围的解码后的字符串
   *
   * @example
   * ```typescript
   * // 读取前 10 个字节并解码为 UTF-8
   * const text = await file.read(0, 10, 'utf8');
   *
   * // 读取第 100-109 字节
   * const data = await file.read(100, 10, 'utf8');
   * ```
   */
  read(position: number, length: number, encoding: BufferEncoding): Promise<string>;

  /**
   * 写入文件内容
   *
   * 如果文件存在会覆盖原有内容，如果文件不存在则创建。
   *
   * @param data - 要写入的内容，可以是字符串、Buffer 或可读流
   *             省略此参数会创建空文件
   *
   * @example
   * ```typescript
   * // 写入字符串
   * await file.write('Hello, World!');
   *
   * // 写入 Buffer
   * await file.write(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
   *
   * // 从其他文件复制
   * const source = fsd('/source.pdf');
   * const dest = fsd('/dest.pdf');
   * const sourceStream = await source.createReadStream();
   * await dest.write(sourceStream);
   *
   * // 创建空文件
   * await file.write();
   * ```
   */
  write(data?: string | Buffer | NodeJS.ReadableStream): Promise<void>;

  /**
   * 创建可读流
   *
   * 适用于大文件的流式处理，避免一次性加载到内存。
   *
   * @param options - 流选项，可指定读取范围
   * @returns 可读的 Node.js Stream
   *
   * @example
   * ```typescript
   * // 创建完整文件的可读流
   * const stream = await file.createReadStream();
   * stream.pipe(process.stdout);
   *
   * // 创建指定范围的可读流
   * const partial = await file.createReadStream({ start: 100, end: 199 });
   *
   * // 流式下载到本地文件
   * const fs = require('fs');
   * const readStream = await file.createReadStream();
   * const writeStream = fs.createWriteStream('/local/file.txt');
   * readStream.pipe(writeStream);
   * ```
   */
  createReadStream(options?: ReadStreamOptions): Promise<NodeJS.ReadableStream>;

  /**
   * 创建可写流
   *
   * 适用于大文件的流式上传，避免一次性加载到内存。
   *
   * @param options - 流选项，可指定写入起始位置
   * @returns 可写的 Node.js Stream（可能附加 promise 属性）
   *
   * @example
   * ```typescript
   * // 创建可写流并写入
   * const stream = await file.createWriteStream();
   * stream.write('Hello');
   * stream.end();
   * if (stream.promise) {
   *   await stream.promise;
   * }
   *
   * // 管道本地文件到可写流
   * const fs = require('fs');
   * const readStream = fs.createReadStream('/local/file.txt');
   * const writeStream = await file.createWriteStream();
   * readStream.pipe(writeStream);
   * await writeStream.promise;
   *
   * // 从指定位置开始写入（断点续传）
   * const stream = await file.createWriteStream({ start: 1024 });
   * ```
   */
  createWriteStream(options?: WriteStreamOptions): Promise<NodeJS.WritableStream>;

  /**
   * 删除文件或目录
   *
   * 如果是目录，会递归删除目录下的所有内容。
   *
   * @example
   * ```typescript
   * // 删除文件
   * await file.unlink();
   *
   * // 删除目录及其所有内容
   * const dir = fsd('/temp/');
   * await dir.unlink();
   * ```
   */
  unlink(): Promise<void>;

  /**
   * 创建目录
   *
   * @param recursive - 是否递归创建父目录
   *
   * @example
   * ```typescript
   * // 创建单级目录（父目录必须存在）
   * const dir = fsd('/uploads/');
   * await dir.mkdir();
   *
   * // 递归创建多级目录
   * const dir = fsd('/a/b/c/');
   * await dir.mkdir(true);
   * ```
   */
  mkdir(recursive?: boolean): Promise<void>;

  /**
   * 读取目录内容
   *
   * 返回目录下的文件和子目录列表。
   *
   * @param recursion - 递归选项：
   *   - `undefined`: 只列出直接子项
   *   - `true`: 递归列出所有子项
   *   - `string`: 使用 glob 模式匹配（如 `**\/*.jpg`）
   * @returns FSDFile 对象数组
   *
   * @example
   * ```typescript
   * // 列出直接子项
   * const files = await dir.readdir();
   * for (const f of files) {
   *   console.log(f.name, f.isDirectory ? '(dir)' : '(file)');
   * }
   *
   * // 递归列出所有文件
   * const allFiles = await dir.readdir(true);
   * console.log(`Total: ${allFiles.length} items`);
   *
   * // 使用 glob 模式筛选
   * const images = await dir.readdir('**\/*.jpg');
   * for (const img of images) {
   *   console.log(img.path);
   * }
   * ```
   */
  readdir(recursion?: true | string): Promise<FSDFile[]>;

  /**
   * 创建可访问的 URL
   *
   * 生成临时访问链接，适用于文件下载、预览等场景。
   *
   * @param options - URL 生成选项
   * @returns 可访问的 URL 字符串
   *
   * @example
   * ```typescript
   * // 创建默认链接（1 小时后过期）
   * const url = await file.createUrl();
   * console.log('Download:', url);
   *
   * // 创建 10 分钟后过期的链接
   * const url = await file.createUrl({ expires: 600 });
   *
   * // 创建带下载提示的链接
   * const url = await file.createUrl({
   *   expires: 3600,
   *   response: {
   *     'content-disposition': 'attachment; filename="report.pdf"'
   *   }
   * });
   *
   * // VOD 适配器：获取不同清晰度
   * const hdUrl = await file.createUrl({ path: '/video/HD' });
   * const sdUrl = await file.createUrl({ path: '/video/SD' });
   * ```
   */
  createUrl(options?: CreateUrlOptions): Promise<string>;

  /**
   * 拷贝文件或目录
   *
   * 将文件或目录复制到目标位置。
   * 目录复制会递归复制所有内容。
   *
   * @param dest - 目标路径（相对或绝对路径）
   * @returns 目标位置的 FSDFile 对象
   *
   * @example
   * ```typescript
   * // 复制文件到同级目录
   * const source = fsd('/file.txt');
   * const copy = await source.copy('file_copy.txt');
   *
   * // 复制文件到子目录
   * const copy = await source.copy('backup/file.txt');
   *
   * // 复制文件到绝对路径
   * const copy = await source.copy('/other/path/file.txt');
   *
   * // 复制目录
   * const dir = fsd('/photos/');
   * await dir.copy('photos_backup/');
   * ```
   */
  copy(dest: string): Promise<FSDFile>;

  /**
   * 重命名或移动文件
   *
   * 将文件或目录移动到新位置（相当于重命名）。
   *
   * @param dest - 目标路径（相对或绝对路径）
   *
   * @example
   * ```typescript
   * // 重命名文件
   * const file = fsd('/old_name.txt');
   * await file.rename('new_name.txt');
   *
   * // 移动文件到子目录
   * await file.rename('backup/file.txt');
   *
   * // 移动文件到绝对路径
   * await file.rename('/other/path/file.txt');
   *
   * // 重命名目录
   * const dir = fsd('/old_folder/');
   * await dir.rename('new_folder/');
   * ```
   */
  rename(dest: string): Promise<void>;

  /**
   * 判断文件或目录是否存在
   *
   * @returns true 表示存在，false 表示不存在
   *
   * @example
   * ```typescript
   * if (await file.exists()) {
   *   console.log('File exists');
   * } else {
   *   await file.write('content');
   * }
   * ```
   */
  exists(): Promise<boolean>;

  /**
   * 判断路径是否为文件
   *
   * @returns true 表示是文件，false 表示不是或不存在
   *
   * @example
   * ```typescript
   * if (await file.isFile()) {
   *   console.log('Size:', await file.size());
   * }
   * ```
   */
  isFile(): Promise<boolean>;

  /**
   * 判断路径是否为目录
   *
   * @returns true 表示是目录，false 表示不是或不存在
   *
   * @example
   * ```typescript
   * if (await dir.isDirectory()) {
   *   const files = await dir.readdir();
   *   console.log(`Contains ${files.length} items`);
   * }
   * ```
   */
  isDirectory(): Promise<boolean>;

  /**
   * 获取文件大小
   *
   * 目录返回 0。
   * 值会被缓存在文件对象中，避免重复查询。
   *
   * @returns 文件大小（字节数）
   *
   * @example
   * ```typescript
   * const size = await file.size();
   * console.log(`File size: ${size} bytes`);
   *
   * // 格式化显示
   * const sizeMB = (await file.size()) / (1024 * 1024);
   * console.log(`File size: ${sizeMB.toFixed(2)} MB`);
   * ```
   */
  size(): Promise<number>;

  /**
   * 获取文件最后修改时间
   *
   * 值会被缓存在文件对象中，避免重复查询。
   *
   * @returns 最后修改时间的 Date 对象
   *
   * @example
   * ```typescript
   * const modified = await file.lastModified();
   * console.log('Last modified:', modified.toISOString());
   *
   * // 判断文件是否过期
   * const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
   * if (modified < oneDayAgo) {
   *   console.log('File is older than 1 day');
   * }
   * ```
   */
  lastModified(): Promise<Date>;

  /**
   * 初始化分片上传任务
   *
   * 用于大文件上传，将文件拆分为多个部分并行上传。
   *
   * @param partCount - 分片数量
   * @returns 任务 ID 数组，每个 ID 对应一个分片
   *
   * @example
   * ```typescript
   * // 初始化 3 个分片
   * const tasks = await file.initMultipartUpload(3);
   * console.log(tasks);
   * // ['task://uploadId?1', 'task://uploadId?2', 'task://uploadId?3']
   * ```
   */
  initMultipartUpload(partCount: number): Promise<Task[]>;

  /**
   * 上传一个分片
   *
   * 将数据块上传到指定分片任务。
   *
   * @param partTask - 分片任务 ID（由 initMultipartUpload 返回）
   * @param data - 分片数据，可以是字符串、Buffer 或可读流
   * @param size - 数据大小（字节数），当 data 为可读流时必须提供
   * @returns 分片信息（包含 ETag）
   *
   * @example
   * ```typescript
   * const tasks = await file.initMultipartUpload(3);
   *
   * // 上传第一个分片（Buffer）
   * const part1 = await file.writePart(tasks[0], Buffer.from('part1'));
   *
   * // 上传第二个分片（流）
   * const stream = fs.createReadStream('/tmp/part2');
   * const part2 = await file.writePart(tasks[1], stream, 1024);
   *
   * // 上传第三个分片（字符串）
   * const part3 = await file.writePart(tasks[2], 'part3');
   *
   * // 完成上传
   * await file.completeMultipartUpload([part1, part2, part3]);
   * ```
   */
  writePart(
    partTask: Task,
    data: string | Buffer | NodeJS.ReadableStream,
    size?: number
  ): Promise<Part>;

  /**
   * 完成分片上传
   *
   * 所有分片上传完成后调用此方法，合并分片为完整文件。
   *
   * @param parts - 分片信息数组（由 writePart 返回）
   *
   * @example
   * ```typescript
   * const tasks = await file.initMultipartUpload(3);
   * const parts: Part[] = [];
   *
   * for (let i = 0; i < tasks.length; i++) {
   *   const part = await file.writePart(tasks[i], getDataForPart(i));
   *   parts.push(part);
   * }
   *
   * // 完成上传（注意：parts 顺序可以与 tasks 顺序不同）
   * await file.completeMultipartUpload(parts);
   * ```
   */
  completeMultipartUpload(parts: Part[]): Promise<void>;

  /**
   * 转换为字符串
   *
   * @returns 文件路径字符串
   *
   * @example
   * ```typescript
   * const file = fsd('/path/to/file.txt');
   * console.log(String(file)); // '/path/to/file.txt'
   * console.log(file.toString()); // '/path/to/file.txt'
   * ```
   */
  toString(): string;

  /**
   * 转换为 JSON
   *
   * @returns 文件路径字符串
   *
   * @example
   * ```typescript
   * const file = fsd('/path/to/file.txt');
   * console.log(JSON.stringify(file)); // '"/path/to/file.txt"'
   * console.log(file.toJSON()); // '/path/to/file.txt'
   * ```
   */
  toJSON(): string;
}

/**
 * 分配文件路径选项
 *
 * 主要用于 VOD 适配器，在上传前分配一个 Video ID 作为文件路径。
 *
 * @example
 * ```typescript
 * // VOD 适配器
 * const videoId = await adapter.alloc({ name: 'video.mp4' });
 * console.log(videoId); // '/1234567890abcdef'
 * const file = fsd(videoId);
 * await file.write(videoData);
 * ```
 */
export interface AllocOptions {
  /**
   * 文件路径
   */
  path?: string;

  /**
   * 文件名
   */
  name?: string;

  /**
   * 文件大小（字节数）
   */
  size?: number;

  /**
   * 其他扩展选项
   */
  [key: string]: any;
}

/**
 * 存储适配器抽象类
 *
 * 所有存储后端（本地文件系统、云存储等）必须实现此接口。
 * 适配器负责与底层存储系统交互，实现具体的存储逻辑。
 *
 * @typeParam T - 适配器配置选项的类型
 *
 * @remarks
 * ### 适配器实现要点
 * 1. 必须设置 `instanceOfFSDAdapter = true`（类型守卫）
 * 2. 必须设置 `name` 属性（适配器名称）
 * 3. 必须设置 `needEnsureDir` 属性（是否需要预先创建目录）
 * 4. 实现所有文件和目录操作方法
 *
 * ### 内置适配器
 * - `FSAdapter` - 本地文件系统适配器（fsd-fs 包）
 * - `OSSAdapter` - 阿里云 OSS 适配器（fsd-oss 包）
 * - `VODAdapter` - 阿里云 VOD 适配器（fsd-vod 包）
 *
 * @example
 * ```typescript
 * class CustomAdapter extends Adapter<CustomOptions> {
 *   readonly instanceOfFSDAdapter = true;
 *   readonly name = 'CustomAdapter';
 *   readonly needEnsureDir = false;
 *
 *   constructor(options: CustomOptions) {
 *     super(options);
 *     // 初始化逻辑
 *   }
 *
 *   async write(path: string, data: any): Promise<void> {
 *     // 实现写入逻辑
 *   }
 *
 *   async read(path: string): Promise<any> {
 *     // 实现读取逻辑
 *   }
 *
 *   // ... 实现其他方法
 * }
 * ```
 */
export class Adapter<T> {
  /**
   * 类型守卫：是否为 Adapter 实例
   */
  readonly instanceOfFSDAdapter: true;

  /**
   * 适配器名称
   *
   * 用于识别适配器类型，如 'FSAdapter', 'OSSAdapter', 'VODAdapter'
   */
  readonly name: string;

  /**
   * 是否需要确保文件夹存在
   *
   * - `true`: 适配器需要预先创建目录（如 FSAdapter）
   * - `false`: 适配器自动处理目录（如 OSSAdapter, VODAdapter）
   *
   * @remarks
   * 当 `needEnsureDir = true` 时，在写入文件前应该先调用 `mkdir()` 创建目录。
   */
  readonly needEnsureDir: boolean;

  /**
   * 分配文件路径（可选）
   *
   * 某些适配器（如 VOD）需要在上传前分配一个 ID 作为文件路径。
   * 对于这些适配器，不能直接使用 `fsd(path)`，必须先调用此方法。
   *
   * @param options - 分配选项
   * @returns 分配的文件路径
   *
   * @example
   * ```typescript
   * // VOD 适配器必须先 alloc
   * const videoId = await adapter.alloc({ name: 'video.mp4' });
   * const file = fsd(videoId);
   * await file.write(videoData);
   * ```
   */
  alloc?: (options?: AllocOptions) => Promise<string>;

  /**
   * 创建上传凭证（可选）
   *
   * 支持边缘上传的适配器（如 OSS）提供此方法。
   * 用于生成临时凭证，让客户端直接上传到云存储，无需通过服务器中转。
   *
   * @param path - 文件路径
   * @param meta - 文件元数据
   * @param durationSeconds - 令牌有效期（秒）
   * @returns 上传凭证对象
   *
   * @example
   * ```typescript
   * // OSS 适配器创建 STS 临时凭证
   * const token = await adapter.createUploadToken(
   *   '/uploads/file.txt',
   *   { contentType: 'image/jpeg' },
   *   3600 // 1 小时有效期
   * );
   *
   * // 将 token 发送给前端
   * res.json({ uploadToken: token });
   *
   * // 前端使用临时凭证直接上传
   * const oss = new OSS({
   *   region: 'oss-cn-hangzhou',
   *   accessKeyId: token.credentials.accessKeyId,
   *   accessKeySecret: token.credentials.accessKeySecret,
   *   stsToken: token.credentials.securityToken,
   *   bucket: 'my-bucket'
   * });
   * await oss.putObject('/uploads/file.txt', fileData);
   * ```
   */
  createUploadToken?: (path: string, meta?: any, durationSeconds?: number) => Promise<any>;

  /**
   * 适配器构造函数
   *
   * @param options - 适配器配置选项
   */
  constructor(options: T);

  /**
   * 向文件追加内容
   *
   * @param path - 文件路径
   * @param data - 要追加的内容
   */
  append(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void>;

  /**
   * 创建可读流
   *
   * @param path - 文件路径
   * @param options - 流选项
   */
  createReadStream(path: string, options?: ReadStreamOptions): Promise<NodeJS.ReadableStream>;

  /**
   * 创建可写流
   *
   * @param path - 文件路径
   * @param options - 流选项
   * @returns 可写流（可能包含 promise 属性）
   */
  createWriteStream(
    path: string,
    options?: WriteStreamOptions
  ): Promise<NodeJS.WritableStream & WithPromise>;

  /**
   * 删除文件或目录
   *
   * @param path - 文件或目录路径
   */
  unlink(path: string): Promise<void>;

  /**
   * 创建目录
   *
   * @param path - 目录路径
   * @param recursive - 是否递归创建父目录
   */
  mkdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * 读取目录内容
   *
   * @param path - 目录路径
   * @param recursion - 递归选项
   * @returns 文件列表，每个文件包含名称和元数据
   */
  readdir(
    path: string,
    recursion?: true | string | any
  ): Promise<Array<{ name: string; metadata?: FileMetadata }>>;

  /**
   * 创建访问 URL
   *
   * @param path - 文件路径
   * @param options - URL 选项
   * @returns 可访问的 URL
   */
  createUrl(path: string, options?: CreateUrlOptions): Promise<string>;

  /**
   * 拷贝文件或目录
   *
   * @param path - 源路径
   * @param dest - 目标路径
   */
  copy(path: string, dest: string): Promise<void>;

  /**
   * 重命名文件或目录
   *
   * @param path - 源路径
   * @param dest - 目标路径
   */
  rename(path: string, dest: string): Promise<void>;

  /**
   * 判断文件或目录是否存在
   *
   * @param path - 文件或目录路径
   */
  exists(path: string): Promise<boolean>;

  /**
   * 判断路径是否为文件
   *
   * @param path - 文件路径
   */
  isFile(path: string): Promise<boolean>;

  /**
   * 判断路径是否为目录
   *
   * @param path - 目录路径
   */
  isDirectory(path: string): Promise<boolean>;

  /**
   * 获取文件大小
   *
   * @param path - 文件路径
   * @returns 文件大小（字节数）
   */
  size(path: string): Promise<number>;

  /**
   * 获取文件最后修改时间
   *
   * @param path - 文件路径
   * @returns 最后修改时间
   */
  lastModified(path: string): Promise<Date>;

  /**
   * 初始化分片上传任务
   *
   * @param path - 目标文件路径
   * @param partCount - 分片数量
   * @returns 任务 ID 数组
   */
  initMultipartUpload(path: string, partCount: number): Promise<Task[]>;

  /**
   * 上传分片
   *
   * @param path - 目标文件路径
   * @param partTask - 分片任务 ID
   * @param data - 分片数据流
   * @param size - 分片大小（字节数）
   * @returns 分片信息
   */
  writePart(path: string, partTask: Task, data: NodeJS.ReadableStream, size: number): Promise<Part>;

  /**
   * 完成分片上传
   *
   * @param path - 目标文件路径
   * @param parts - 分片信息数组
   */
  completeMultipartUpload(path: string, parts: Part[]): Promise<void>;
}

/**
 * 文件生成器函数
 *
 * FSD 工厂函数的返回类型，用于创建 FSDFile 实例。
 *
 * @remarks
 * 这是一个函数类型，调用时传入路径返回 FSDFile 对象。
 * 同时也是一个对象，包含 `adapter` 属性引用底层适配器。
 *
 * @example
 * ```typescript
 * const fsd = FSD({ adapter: new FSAdapter({ root: '/uploads' }) });
 *
 * // 作为函数调用：创建文件对象
 * const file = fsd('/test.txt');
 *
 * // 访问 adapter 属性
 * console.log(fsd.adapter.name); // 'FSAdapter'
 * ```
 */
export interface FileGenerator {
  /**
   * 底层存储适配器
   */
  adapter: Adapter<any>;

  /**
   * 创建文件对象
   *
   * @param path - 文件或目录路径
   * @returns FSDFile 实例
   */
  (path: string): FSDFile;
}

/**
 * FSD 工厂函数
 *
 * 创建文件系统驱动实例的入口函数。
 *
 * @param options - 配置选项，必须指定存储适配器
 * @returns 文件生成器函数
 *
 * @example
 * ```typescript
 * import FSD from 'fsd';
 * import FSAdapter from 'fsd-fs';
 * import OSSAdapter from 'fsd-oss';
 *
 * // 使用本地文件系统
 * const fsd = FSD({
 *   adapter: new FSAdapter({ root: '/uploads' })
 * });
 *
 * // 使用阿里云 OSS
 * const fsd = FSD({
 *   adapter: new OSSAdapter({
 *     accessKeyId: 'xxx',
 *     accessKeySecret: 'xxx',
 *     region: 'oss-cn-hangzhou',
 *     bucket: 'my-bucket'
 *   })
 * });
 *
 * // 创建文件对象
 * const file = fsd('/test.txt');
 * await file.write('Hello, FSD!');
 * ```
 */
export default function FSD(options: DriverOptions): FileGenerator;
