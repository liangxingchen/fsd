import { Adapter } from 'fsd';

/**
 * OSSAdapter 配置选项
 *
 * 阿里云 OSS 对象存储适配器的初始化配置。
 *
 * @example
 * ```typescript
 * const adapter = new OSSAdapter({
 *   accessKeyId: 'your-access-key-id',
 *   accessKeySecret: 'your-access-key-secret',
 *   region: 'oss-cn-hangzhou',
 *   bucket: 'my-bucket'
 * });
 * ```
 */
export interface OSSAdapterOptions {
  /**
   * OSS 存储根路径（可选）
   *
   * 以 OSS 子目录作为存储根路径。
   * 所有文件操作都会在此路径下进行。
   *
   * @example
   * ```typescript
   * root: '/uploads'
   * // 文件路径: '/uploads/file.txt'
   * // OSS 实际路径: 'uploads/file.txt'
   * ```
   */
  root?: string;

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
   */
  urlPrefix?: string;

  /**
   * 是否公共读（可选）
   *
   * 控制生成的 URL 是否需要签名访问。
   *
   * - `true`: 公共 Bucket，生成直接访问 URL（无需签名）
   * - `false`: 私有 Bucket，生成带签名的临时 URL（默认值）
   *
   * @example
   * ```typescript
   * // 公共访问
   * publicRead: true,
   * // URL: https://bucket.oss-cn-hangzhou.aliyuncs.com/file.jpg
   *
   * // 私有访问
   * publicRead: false,
   * // URL: https://bucket.oss-cn-hangzhou.aliyuncs.com/file.jpg?OSSAccessKeyId=...&Expires=...
   * ```
   */
  publicRead?: boolean;

  /**
   * OSS 访问 Key ID（必需）
   *
   * 阿里云 OSS 的 Access Key ID。
   *
   * @example
   * ```typescript
   * accessKeyId: 'LTAI5txxxxxxxxxxxxx'
   * ```
   */
  accessKeyId: string;

  /**
   * OSS 访问 Key Secret（必需）
   *
   * 阿里云 OSS 的 Access Key Secret。
   *
   * @example
   * ```typescript
   * accessKeySecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
   * ```
   *
   * @remarks
   * 请妥善保管此密钥，不要提交到代码仓库。
   * 建议使用环境变量存储。
   */
  accessKeySecret: string;

  /**
   * OSS Bucket 名称（可选）
   *
   * 如果不指定，需要在上传时在 path 中包含 bucket 名称。
   *
   * @example
   * ```typescript
   * bucket: 'my-bucket',
   * // 文件路径: '/uploads/file.txt'
   * // OSS 实际路径: 'my-bucket/uploads/file.txt'
   * ```
   */
  bucket?: string;

  /**
   * OSS 区域代码（必需）
   *
   * 阿里云 OSS 的区域代码，如 'oss-cn-hangzhou'。
   *
   * @example
   * ```typescript
   * region: 'oss-cn-hangzhou',  // 华东1（杭州）
   * region: 'oss-cn-shanghai', // 华东2（上海）
   * region: 'oss-us-west-1'   // 美西1（硅谷）
   * ```
   *
   * @remarks
   * 常见区域代码：
   * - oss-cn-hangzhou: 华东1（杭州）
   * - oss-cn-shanghai: 华东2（上海）
   * - oss-cn-beijing: 华北2（北京）
   * - oss-cn-shenzhen: 华南1（深圳）
   * - oss-cn-hongkong: 香港
   * - oss-us-west-1: 美西1（硅谷）
   */
  region: string;

  /**
   * 是否内网访问（可选）
   *
   * - `true`: 使用内网地址（更快且免费）
   * - `false`: 使用公网地址（默认值）
   *
   * @example
   * ```typescript
   * // 如果应用和 OSS 在同一区域，使用内网
   * internal: true,
   * // 实际 endpoint: bucket.oss-cn-hangzhou-internal.aliyuncs.com
   * ```
   */
  internal?: boolean;

  /**
   * 是否使用 HTTPS（可选）
   *
   * - `true`: 使用 HTTPS（默认值）
   * - `false`: 使用 HTTP
   *
   * @example
   * ```typescript
   * secure: true,   // https://bucket.oss-cn-hangzhou.aliyuncs.com
   * secure: false,  // http://bucket.oss-cn-hangzhou.aliyuncs.com
   * ```
   */
  secure?: boolean;

  /**
   * 请求超时时间（可选）
   *
   * 单位：毫秒（数字）或秒（字符串）
   *
   * @example
   * ```typescript
   * timeout: 60000,    // 60 秒（毫秒）
   * timeout: '60s'     // 60 秒（字符串）
   * timeout: 120000    // 120 秒
   * ```
   */
  timeout?: string | number;

  /**
   * 阿里云账号 ID（可选）
   *
   * 用于 STS 角色扮演，生成边缘上传的临时凭证。
   *
   * @example
   * ```typescript
   * accountId: '1234567890123456',
   * roleName: 'AliyunOSSRole'
   * ```
   *
   * @remarks
   * 当同时提供 `accountId` 和 `roleName` 时，适配器会生成 STS 临时凭证。
   * 临时凭证用于客户端直接上传到 OSS，无需通过服务器中转。
   */
  accountId?: string;

  /**
   * 阿里云角色名称（可选）
   *
   * 用于 STS 角色扮演，配合 `accountId` 使用。
   *
   * @example
   * ```typescript
   * accountId: '1234567890123456',
   * roleName: 'AliyunOSSRole'
   * ```
   */
  roleName?: string;

  /**
   * 上传回调 URL（可选）
   *
   * 文件上传完成后，OSS 会调用此 URL 通知应用。
   *
   * @example
   * ```typescript
   * callbackUrl: 'https://api.example.com/oss/callback'
   * ```
   *
   * @remarks
   * 回调 body 包含：
   * - bucket: Bucket 名称
   * - path: 文件路径
   * - etag: 文件 ETag
   * - size: 文件大小
   * - mimeType: MIME 类型
   * - imageInfo: 图片信息（如果是图片）
   */
  callbackUrl?: string;

  /**
   * 缩略图配置（可选）
   *
   * 配置缩略图规格和样式。
   *
   * @example
   * ```typescript
   * thumbs: {
   *   'small': '?x-oss-process=style/small',
   *   'medium': '?x-oss-process=style/medium',
   *   'large': '?x-oss-process=style/large'
   * }
   * ```
   *
   * @remarks
   * 缩略图通过 OSS 图片处理服务生成。
   * 使用时在 `createUrl()` 中指定 thumb 选项。
   */
  thumbs?: {
    /**
     * 缩略图规格名
     *
     * 值为 OSS 图片处理参数。
     * 常用：
     * - `?x-oss-process=image/resize,w_100`: 调整宽度到 100px
     * - `?x-oss-process=image/crop,w_100,h_100`: 裁剪 100x100
     * - `?x-oss-process=style/name`: 使用命名样式
     */
    [name: string]: string;
  };
}

/**
 * 上传凭证
 *
 * 包含临时访问凭证的返回值。
 *
 * @example
 * ```typescript
 * {
 *   auth: {
 *     accessKeyId: 'STS.xxxxxxxxxxxxxx',
 *     accessKeySecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 *     stsToken: 'CAESxxxx...',
 *     bucket: 'my-bucket',
 *     endpoint: 'oss-cn-hangzhou.aliyuncs.com'
 *   },
 *   path: '/uploads/file.jpg',
 *   expiration: 17001234567890,
 *   callback: undefined
 * }
 * ```
 */
export interface UploadToken {
  /**
   * 认证信息
   *
   * 包含临时的访问密钥和 STS Token。
   */
  auth: {
    /**
     * 临时 Access Key ID
     */
    accessKeyId: string;

    /**
     * 临时 Access Key Secret
     */
    accessKeySecret: string;

    /**
     * STS 临时 Token
     */
    stsToken: string;

    /**
     * Bucket 名称
     */
    bucket: string;

    /**
     * OSS 访问地址
     */
    endpoint: string;
  };

  /**
   * 上传目标路径
   *
   * 文件在 OSS 中的完整路径。
   */
  path: string;

  /**
   * 凭证过期时间（Unix 时间戳，秒）
   *
   * 过期后凭证将失效。
   */
  expiration: number;

  /**
   * 回调数据（可选）
   *
   * 如果配置了 `callbackUrl`，此项存在。
   */
  callback?: any;
}

/**
 * 带自动刷新的上传凭证
 *
 * 包含自动刷新 STS Token 的上传凭证。
 *
 * @example
 * ```typescript
 * {
 *   auth: {
 *     accessKeyId: 'STS.xxxxxxxxxxxxxx',
 *     accessKeySecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 *     stsToken: 'CAESxxxx...',
 *     bucket: 'my-bucket',
 *     endpoint: 'oss-cn-hangzhou.aliyuncs.com',
 *     refreshSTSToken: [Function: refresh]
 *   },
 *   path: '/uploads/file.jpg',
 *   expiration: 17001234567890
 * }
 * ```
 *
 * @remarks
 * 当凭证即将过期时，调用 `refreshSTSToken()` 获取新的临时凭证。
 */
export interface UploadTokenWithAutoRefresh {
  /**
   * 认证信息
   */
  auth: {
    /**
     * 临时 Access Key ID
     */
    accessKeyId: string;

    /**
     * 临时 Access Key Secret
     */
    accessKeySecret: string;

    /**
     * STS 临时 Token
     */
    stsToken: string;

    /**
     * Bucket 名称
     */
    bucket: string;

    /**
     * OSS 访问地址
     */
    endpoint: string;

    /**
     * 自动刷新 STS Token 的函数
     *
     * 调用此函数获取新的临时凭证。
     *
     * @example
     * ```typescript
     * const newToken = await auth.refreshSTSToken();
     * console.log(newToken.stsToken);
     * ```
     */
    refreshSTSToken: () => Promise<{
      accessKeyId: string;
      accessKeySecret: string;
      stsToken: string;
    }>;
  };

  /**
   * 上传目标路径
   */
  path: string;

  /**
   * 凭证过期时间
   */
  expiration: number;

  /**
   * 回调数据（可选）
   */
  callback?: any;
}

/**
 * 阿里云 OSS 适配器
 *
 * 提供对阿里云 OSS 对象存储的访问能力。
 *
 * @remarks
 * ### 核心特性
 * - 完整的文件 CRUD 操作（create, read, update, delete）
 * - 分段上传（大文件优化）
 * - STS 角色扮演（边缘上传）
 * - 上传回调通知
 * - 缩略图支持
 *
 * ### 不支持的操作
 * - `mkdir()` - OSS 无目录概念
 * - `createReadStream({ start })` - 不支持 start 选项
 *
 * ### 已废弃的选项
 * - `endpoint` - 已废弃，使用 `region/[internal]/[secure]` 代替
 *
 * ### 自定义 OSS 客户端
 * - 内部使用 `SimpleOSSClient` 封装阿里云 OSS API
 *
 * ### STS 角色扮演
 * - 配置 `accountId` + `roleName` 时自动启用
 * - 用于客户端直接上传到 OSS（边缘上传）
 *
 * @example
 * ```typescript
 * import OSSAdapter from 'fsd-oss';
 * import FSD from 'fsd';
 *
 * // 基础配置
 * const adapter = new OSSAdapter({
 *   accessKeyId: process.env.OSS_ACCESS_KEY_ID,
 *   accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
 *   region: process.env.OSS_REGION,
 *   bucket: process.env.OSS_BUCKET
 * });
 *
 * const fsd = FSD({ adapter });
 *
 * // 上传文件
 * await fsd('/uploads/file.jpg').write(buffer);
 *
 * // 生成访问 URL
 * const url = await fsd('/uploads/file.jpg').createUrl({ expires: 3600 });
 * ```
 */
export default class OSSAdapter extends Adapter<OSSAdapterOptions> {
  /**
   * 创建上传凭证
   *
   * 生成用于客户端直接上传到 OSS 的临时凭证。
   *
   * @param path - 文件路径
   * @param meta - 文件元数据（可选）
   * @param durationSeconds - 凭证有效期（秒），默认 3600（1 小时）
   * @returns 上传凭证对象
   *
   * @example
   * ```typescript
   * // 生成 1 小时有效的上传凭证
   * const token = await adapter.createUploadToken(
   *   '/uploads/photo.jpg',
   *   { contentType: 'image/jpeg' },
   *   3600
   * );
   *
   * // 将 token 发送给前端
   * res.json({ uploadToken: token });
   * ```
   *
   * @remarks
   * 如果配置了 `accountId` 和 `roleName`，会生成 STS 临时凭证。
   */
  createUploadToken: (path: string, meta?: any, durationSeconds?: number) => Promise<UploadToken>;

  /**
   * 创建带自动刷新的上传凭证
   *
   * 生成支持自动刷新 STS Token 的上传凭证。
   *
   * @param path - 文件路径
   * @param meta - 文件元数据（可选）
   * @param durationSeconds - 凭证有效期（秒），默认 3600（1 小时）
   * @returns 带刷新功能的上传凭证对象
   *
   * @example
   * ```typescript
   * const token = await adapter.createUploadTokenWithAutoRefresh(
   *   '/uploads/large-video.mp4',
   *   { contentType: 'video/mp4' },
   *   3600
   * );
   *
   * // 当凭证快过期时，自动刷新
   * const newAuth = await token.auth.refreshSTSToken();
   * ```
   */
  createUploadTokenWithAutoRefresh: (
    path: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;
}
