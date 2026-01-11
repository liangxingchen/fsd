import { Adapter } from 'fsd';

/**
 * FSAdapter 配置选项
 *
 * 本地文件系统适配器的初始化配置。
 *
 * @example
 * ```typescript
 * const adapter = new FSAdapter({
 *   root: '/app/uploads',
 *   mode: 0o644,
 *   tmpdir: '/tmp/fsd-tmp',
 *   urlPrefix: 'https://cdn.example.com'
 * });
 * ```
 */
export interface FSAdapterOptions {
  /**
   * 本地存储根路径（必需）
   *
   * 所有文件操作都会在此根路径下进行。
   * 此路径必须是绝对路径，并且适配器有读取/写入权限。
   *
   * @example
   * ```typescript
   * // Linux/Mac
   * root: '/app/uploads'
   *
   * // Windows
   * root: 'C:\\app\\uploads'
   * ```
   *
   * @remarks
   * 确保此目录存在且有适当的读写权限。
   */
  root: string;

  /**
   * 创建文件的权限模式（可选）
   *
   * 默认值：`0o644` (rw-rw-rw-)
   *
   * @example
   * ```typescript
   * mode: 0o644,  // rw-r--r-- (用户读写，组和其他只读）
   * mode: 0o755,  // rwxr-xr-x (用户读写执行，组和其他读执行)
   * mode: 0o600,  // rw------- (仅用户可读写）
   * ```
   *
   * @remarks
   * 使用八进制表示法（0o 前缀）或十进制都可以。
   */
  mode?: number;

  /**
   * URL 前缀（可选）
   *
   * 用于生成访问链接时添加前缀。
   * 通常配合 CDN 或反向代理使用。
   *
   * @example
   * ```typescript
   * urlPrefix: 'https://cdn.example.com',
   * // file.createUrl() 返回: https://cdn.example.com/uploads/file.txt
   * ```
   *
   * @remarks
   * 尾部会自动去除 `/`，例如 `'https://cdn.com/'` 会被标准化为 `'https://cdn.com'`。
   */
  urlPrefix?: string;

  /**
   * 临时目录（可选）
   *
   * 用于分段上传时暂存分片文件。
   * 如果不使用分段上传功能，可以省略此选项。
   *
   * @example
   * ```typescript
   * tmpdir: '/tmp/fsd-multipart',
   * // 或使用系统默认临时目录
   * tmpdir: os.tmpdir()
   * ```
   *
   * @remarks
   * 默认值：系统临时目录（通过 `os.tmpdir()` 获取）。
   * 确保临时目录有足够的磁盘空间用于存储分片文件。
   */
  tmpdir?: string;
}

/**
 * 本地文件系统适配器
 *
 * 提供对服务器本地磁盘文件的读写访问。
 *
 * @remarks
 * ### 特性
 * - 支持完整的文件和目录操作
 * - 支持流式读写
 * - 支持分段上传（大文件）
 * - 支持递归目录列表
 * - 使用 glob 模式匹配
 *
 * ### 权限要求
 * - `root` 目录必须有读写权限
 * - `tmpdir` 目录（用于分段上传）必须有读写权限
 *
 * ### 性能优化
 * - 使用 `mapLimit` 限制并发操作，避免文件系统过载
 * - 使用 `glob` 进行高效的目录遍历
 *
 * ### 分段上传机制
 * 1. 调用 `initMultipartUpload()` 初始化任务
 * 2. 每个分片写入到 `tmpdir` 下的临时文件
 * 3. 调用 `completeMultipartUpload()` 时，所有临时文件会被顺序追加到目标文件
 * 4. 完成后临时文件会被自动删除
 *
 * @example
 * ```typescript
 * import FSAdapter from 'fsd-fs';
 * import FSD from 'fsd';
 *
 * // 创建适配器
 * const adapter = new FSAdapter({
 *   root: '/app/uploads',
 *   mode: 0o644,
 *   tmpdir: '/tmp/fsd-tmp'
 * });
 *
 * // 创建 FSD 实例
 * const fsd = FSD({ adapter });
 *
 * // 基本操作
 * await fsd('/test.txt').write('Hello, FS!');
 * const content = await fsd('/test.txt').read('utf8');
 *
 * // 分段上传大文件
 * const file = fsd('/large-file.dat');
 * const tasks = await file.initMultipartUpload(3);
 * for (let i = 0; i < tasks.length; i++) {
 *   await file.writePart(tasks[i], getDataForPart(i));
 * }
 * await file.completeMultipartUpload(['part://...', 'part://...', 'part://...']);
 * ```
 */
export default class FSAdapter extends Adapter<FSAdapterOptions> {}
