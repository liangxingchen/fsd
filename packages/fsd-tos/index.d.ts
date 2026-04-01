import { Adapter } from 'fsd';

/**
 * TOSAdapter 配置选项
 *
 * 火山引擎 TOS 对象存储适配器的初始化配置。
 *
 * @example
 * ```typescript
 * const adapter = new TOSAdapter({
 *   accessKeyId: 'your-access-key-id',
 *   accessKeySecret: 'your-access-key-secret',
 *   region: 'cn-beijing',
 *   bucket: 'my-bucket'
 * });
 * ```
 */
export interface TOSAdapterOptions {
  /**
   * TOS 访问 Key ID（必需）
   *
   * 火山引擎的 Access Key ID。
   */
  accessKeyId: string;

  /**
   * TOS 访问 Key Secret（必需）
   *
   * 火山引擎的 Access Key Secret。
   *
   * @remarks
   * 请妥善保管此密钥，不要提交到代码仓库。
   * 建议使用环境变量存储。
   */
  accessKeySecret: string;

  /**
   * TOS 区域（必需）
   *
   * 火山引擎 TOS 的区域，如 'cn-beijing'。
   *
   * @example
   * ```typescript
   * region: 'cn-beijing',   // 华北-北京
   * region: 'cn-guangzhou', // 华南-广州
   * region: 'cn-shanghai'   // 华东-上海
   * ```
   */
  region: string;

  /**
   * TOS Bucket 名称（可选）
   *
   * 如果不指定，需要在上传时在 path 中包含 bucket 名称。
   */
  bucket?: string;

  /**
   * TOS Endpoint（可选）
   *
   * 默认根据 region 自动生成。
   * 如需自定义可手动指定，如 'tos-cn-beijing.volces.com'。
   */
  endpoint?: string;

  /**
   * TOS 存储根路径（可选）
   *
   * 以 TOS 子目录作为存储根路径。
   * 所有文件操作都会在此路径下进行。
   *
   * @defaultValue '/'
   */
  root?: string;

  /**
   * URL 前缀（可选）
   *
   * 用于生成访问链接时添加前缀。
   * 通常配合 CDN 或反向代理使用。
   */
  urlPrefix?: string;

  /**
   * 是否公共读（可选）
   *
   * - `true`: 公共 Bucket，生成直接访问 URL（无需签名）
   * - `false`: 私有 Bucket，生成带签名的临时 URL（默认值）
   */
  publicRead?: boolean;

  /**
   * 请求超时时间（可选）
   *
   * 单位：毫秒。
   */
  timeout?: number;

  /**
   * STS 临时 Token（可选）
   *
   * 用于临时凭证访问。
   */
  stsToken?: string;

  /**
   * 火山引擎账号 ID（可选）
   *
   * 用于 STS 角色扮演，生成边缘上传的临时凭证。
   *
   * @example
   * ```typescript
   * accountId: '2000000001',
   * roleName: 'TOSUploadRole'
   * ```
   *
   * @remarks
   * 当同时提供 `accountId` 和 `roleName` 时，适配器会生成 STS 临时凭证。
   * 临时凭证用于客户端直接上传到 TOS，无需通过服务器中转。
   */
  accountId?: string;

  /**
   * 火山引擎角色名称（可选）
   *
   * 用于 STS 角色扮演，配合 `accountId` 使用。
   *
   * @example
   * ```typescript
   * accountId: '2000000001',
   * roleName: 'TOSUploadRole'
   * ```
   */
  roleName?: string;

  /**
   * 上传回调 URL（可选）
   *
   * 文件上传完成后，TOS 会调用此 URL 通知应用。
   *
   * @example
   * ```typescript
   * callbackUrl: 'https://api.example.com/tos/callback'
   * ```
   */
  callbackUrl?: string;
}

/**
 * 火山引擎 TOS 适配器
 *
 * 提供对火山引擎 TOS 对象存储的访问能力。
 *
 * @remarks
 * ### 核心特性
 * - 完整的文件 CRUD 操作
 * - 原生追加上传（AppendObject）
 * - 分段上传（大文件优化）
 * - 原生重命名（RenameObject）
 * - 预签名 URL
 *
 * ### 不支持的操作
 * - `createWriteStream({ start })` - 不支持 start 选项
 *
 * @example
 * ```typescript
 * import TOSAdapter from 'fsd-tos';
 * import FSD from 'fsd';
 *
 * const adapter = new TOSAdapter({
 *   accessKeyId: process.env.TOS_ACCESS_KEY_ID,
 *   accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET,
 *   region: 'cn-beijing',
 *   bucket: process.env.TOS_BUCKET
 * });
 *
 * const fsd = FSD({ adapter });
 * await fsd('/uploads/file.jpg').write(buffer);
 * const url = await fsd('/uploads/file.jpg').createUrl({ expires: 3600 });
 * ```
 */
/**
 * 上传凭证
 *
 * 包含临时访问凭证的返回值。
 */
export interface UploadToken {
  auth: {
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
    bucket: string;
    endpoint: string;
  };
  path: string;
  expiration: string;
  callback?: any;
}

/**
 * 带自动刷新的上传凭证
 */
export interface UploadTokenWithAutoRefresh {
  auth: {
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
    bucket: string;
    endpoint: string;
    refreshSTSToken: () => Promise<{
      accessKeyId: string;
      accessKeySecret: string;
      stsToken: string;
    }>;
  };
  path: string;
  expiration: string;
  callback?: any;
}

export default class TOSAdapter extends Adapter<TOSAdapterOptions> {
  createUploadToken: (path: string, meta?: any, durationSeconds?: number) => Promise<UploadToken>;
  createUploadTokenWithAutoRefresh: (
    path: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;
}
