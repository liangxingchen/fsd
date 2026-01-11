import { Adapter } from 'fsd';

/**
 * VODAdapter 配置选项
 *
 * 阿里云 VOD（视频点播）适配器的初始化配置。
 *
 * @example
 * ```typescript
 * const adapter = new VODAdapter({
 *   accessKeyId: 'your-access-key-id',
 *   accessKeySecret: 'your-access-key-secret',
 *   privateKey: 'your-rsa-private-key'
 * });
 * ```
 */
export interface VODAdapterOptions {
  /**
   * URL 前缀（可选）
   *
   * 用于生成播放链接时添加前缀。
   * 通常配合 CDN 使用。
   *
   * @example
   * ```typescript
   * urlPrefix: 'https://cdn.example.com',
   * // createUrl() 返回: https://cdn.example.com/video/HD
   * ```
   */
  urlPrefix?: string;

  /**
   * 是否公共读（可选）
   *
   * 控制生成的播放 URL 是否需要签名访问。
   *
   * - `true`: 公共视频，生成直接访问 URL（无需签名）
   * - `false`: 私有视频，生成带签名的临时 URL（默认值）
   *
   * @remarks
   * 如果不公共读，必须提供 `privateKey` 用于生成签名。
   */
  publicRead?: boolean;

  /**
   * 私有访问签名密钥（可选）
   *
   * 用于生成私有视频播放 URL 的签名。
   *
   * @example
   * ```typescript
   * privateKey: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'
   * ```
   *
   * @remarks
   * RSA 私钥用于生成播放 URL 的签名。
   * 请妥善保管此密钥，不要提交到代码仓库。
   * 建议使用环境变量存储。
   */
  privateKey?: string;

  /**
   * OSS 访问 Key ID（必需）
   *
   * 阿里云 OSS 访问凭证（VOD 依赖 OSS 存储视频文件）。
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
   * 阿里云 OSS 访问凭证。
   */
  accessKeySecret: string;

  /**
   * OSS 区域代码（可选）
   *
   * 阿里云 OSS 区域，如 'oss-cn-hangzhou'。
   * 默认值：'cn-shanghai'
   *
   * @example
   * ```typescript
   * region: 'oss-cn-hangzhou',  // 华东1（杭州）
   * region: 'oss-cn-shanghai', // 华东2（上海）
   * ```
   */
  region?: string;

  /**
   * 转码模板组 ID（可选）
   *
   * 用于视频转码时的模板组。
   *
   * @example
   * ```typescript
   * templateGroupId: 'your-template-group-id'
   * ```
   *
   * @remarks
   * 模板组在阿里云 VOD 控制台创建。
   */
  templateGroupId?: string;

  /**
   * 工作流 ID（可选）
   *
   * 用于视频上传后的自动化处理流程。
   *
   * @example
   * ```typescript
   * workflowId: 'your-workflow-id'
   * ```
   *
   * @remarks
   * 工作流在阿里云 VOD 控制台创建。
   * 可以包括转码、截图、AI 处理等步骤。
   */
  workflowId?: string;

  /**
   * 上传回调 URL（可选）
   *
   * 视频上传完成后，VOD 会调用此 URL 通知应用。
   *
   * @example
   * ```typescript
   * callbackUrl: 'https://api.example.com/vod/callback'
   * ```
   *
   * @remarks
   * 回调 body 包含视频 ID、状态等信息。
   */
  callbackUrl?: string;
}

/**
 * 视频信息
 *
 * 视频的基本信息和状态。
 *
 * @example
 * ```typescript
 * {
 *   VideoId: '1234567890abcdef',
 *   Title: 'My Video',
 *   Status: 'Normal',
 *   Size: 1048576,
 *   Duration: '10.5'
 * }
 * ```
 */
export interface VideoInfo {
  /**
   * 审核状态
   */
  AuditStatus: string;

  /**
   * 下载开关
   */
  DownloadSwitch: string;

  /**
   * 预处理状态
   */
  PreprocessStatus: string;

  /**
   * 修改时间
   */
  ModificationTime: string;

  /**
   * 视频 ID
   */
  VideoId: string;

  /**
   * 应用 ID
   */
  AppId: string;

  /**
   * 修改时间
   */
  ModifyTime: string;

  /**
   * 视频标题
   */
  Title: string;

  /**
   * 创建时间
   */
  CreationTime: string;

  /**
   * 状态
   */
  Status: string;

  /**
   * 转码模板组 ID
   */
  TemplateGroupId: string;

  /**
   * 区域 ID
   */
  RegionId: string;

  /**
   * 视频时长（秒）
   */
  Duration: number;

  /**
   * 创建时间
   */
  CreateTime: string;

  /**
   * 快照列表
   */
  Snapshots: { Snapshot: string[] };

  /**
   * 存储位置
   */
  StorageLocation: string;

  /**
   * 视频大小（字节）
   */
  Size: number;
}

/**
 * 媒体信息
 *
 * 视频转码后的媒体信息（不同清晰度）。
 *
 * @example
 * ```typescript
 * {
 *   VideoId: '1234567890abcdef',
 *   OutputType: 'MP4',
 *   PreprocessStatus: 'PreprocessingSuccess',
 *   FileURL: 'https://vod.oss-cn-hangzhou.aliyuncs.com/.../video.mp4',
 *   Duration: '10.5',
 *   Width: 1920,
 *   Height: 1080,
 *   Size: 1048576,
 *   CreationTime: '2024-01-01T00:00:00Z'
 * }
 * ```
 */
export interface MezzanineInfo {
  /**
   * 预处理状态
   */
  PreprocessStatus: string;

  /**
   * 视频 ID
   */
  VideoId: string;

  /**
   * 输出类型
   */
  OutputType: string;

  /**
   * CRC64 校验码
   */
  CRC64: string;

  /**
   * 创建时间
   */
  CreationTime: string;

  /**
   * 状态
   */
  Status: string;

  /**
   * 文件名
   */
  FileName: string;

  /**
   * 时长（秒）
   */
  Duration: string;

  /**
   * 视频高度
   */
  Height: number;

  /**
   * 视频宽度
   */
  Width: number;

  /**
   * 帧率
   */
  Fps: string;

  /**
   * 比特率
   */
  Bitrate: string;

  /**
   * 文件 URL
   */
  FileURL: string;

  /**
   * 文件大小（字节）
   */
  Size: number;
}

/**
 * 视频基础信息
 *
 * 视频的元数据信息。
 *
 * @example
 * ```typescript
 * {
 *   VideoId: '1234567890abcdef',
 *   MediaType: 'video',
 *   Status: 'Normal',
 *   Title: 'My Video',
 *   Duration: '10.5'
 * }
 * ```
 */
export interface VideoBase {
  /**
   * 转码模式
   */
  TranscodeMode: string;

  /**
   * 创建时间
   */
  CreationTime: string;

  /**
   * 封面图 URL
   */
  CoverURL: string;

  /**
   * 状态
   */
  Status: string;

  /**
   * 媒体类型
   */
  MediaType: string;

  /**
   * 视频 ID
   */
  VideoId: string;

  /**
   * 时长（秒）
   */
  Duration: string;

  /**
   * 输出类型
   */
  OutputType: string;

  /**
   * 标题
   */
  Title: string;
}

/**
 * 播放信息
 *
 * 视频的播放配置信息。
 *
 * @example
 * ```typescript
 * {
 *   RequestId: 'request-id',
 *   VideoBase: {
 *     PlayURL: 'https://vod.oss-cn-hangzhou.aliyuncs.com/.../video.m3u8',
 *     Height: 1080,
 *     Width: 1920,
 *     Duration: '10.5',
 *     Definition: 'HD'
 *   }
 * }
 * ```
 */
export interface PlayInfo {
  /**
   * 格式（如 'mp4', 'm3u8'）
   */
  Format: string;

  /**
   * 流类型（如 'HLS', 'DASH'）
   */
  StreamType: string;

  /**
   * 预处理状态
   */
  PreprocessStatus: string;

  /**
   * 修改时间
   */
  ModificationTime: string;

  /**
   * 规格
   */
  Specification: string;

  /**
   * 视频高度
   */
  Height: number;

  /**
   * 播放 URL
   */
  PlayURL: string;

  /**
   * 码率类型
   */
  NarrowBandType: string;

  /**
   * 创建时间
   */
  CreationTime: string;

  /**
   * 状态
   */
  Status: string;

  /**
   * 时长（秒）
   */
  Duration: string;

  /**
   * 任务 ID
   */
  JobId: string;

  /**
   * 加密标志
   */
  Encrypt: number;

  /**
   * 视频宽度
   */
  Width: number;

  /**
   * 帧率
   */
  Fps: string;

  /**
   * 比特率
   */
  Bitrate: string;

  /**
   * 清晰度（如 'HD', 'SD', '4K'）
   */
  Definition: string;

  /**
   * 文件大小（字节）
   */
  Size: number;
}

/**
 * 播放信息结果
 *
 * 包含视频基础信息和播放信息列表。
 *
 * @example
 * ```typescript
 * {
 *   RequestId: 'request-id',
 *   VideoBase: {
 *     // ... 基础信息
 *   },
 *   PlayInfoList: {
 *     PlayInfo: [
 *       {
 *         Format: 'mp4',
 *         PlayURL: 'https://...',
 *         Definition: 'HD'
 *       },
 *       {
 *         Format: 'm3u8',
 *         PlayURL: 'https://...',
 *         Definition: 'SD'
 *       }
 *     ]
 *   }
 * }
 * ```
 */
export interface PlayInfoResult {
  /**
   * 请求 ID
   */
  RequestId: string;

  /**
   * 视频基础信息
   */
  VideoBase: VideoBase;

  /**
   * 播放信息列表
   */
  PlayInfoList: {
    /**
     * 播放信息数组
     *
     * 可能包含多种格式（MP4、M3U8）或多种清晰度（HD、SD）的播放地址。
     */
    PlayInfo: PlayInfo[];
  };
}

/**
 * 上传凭证
 *
 * 包含临时 OSS 访问凭证的返回值。
 *
 * @example
 * ```typescript
 * {
 *   auth: {
 *     accessKeyId: 'STS.xxxxxxxxxxxxxx',
 *     accessKeySecret: 'xxxxxxxxxxxxxxxxxxxxxxxx',
 *     stsToken: 'CAESxxxx...',
 *     bucket: 'my-bucket',
 *     endpoint: 'oss-cn-hangzhou.aliyuncs.com'
 *   },
 *   path: '/videos/video.mp4',
 *   expiration: 17001234567890
 * }
 * ```
 */
export interface UploadToken {
  /**
   * 认证信息
   *
   * 包含临时 OSS 访问凭证。
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
   */
  path: string;

  /**
   * 凭证过期时间（Unix 时间戳，秒）
   */
  expiration: number;

  /**
   * 回调数据（可选）
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
 *     // ... 认证信息
 *     refreshSTSToken: [Function: refresh]
 *   },
 *   path: '/videos/video.mp4',
 *   expiration: 17001234567890
 * }
 * ```
 *
 * @remarks
 * 当凭证即将过期时，调用 `refreshSTSToken()` 获取新的临时凭证。
 * 适用于大文件上传，避免上传过程中凭证过期。
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
     * const newAuth = await auth.refreshSTSToken();
     * console.log(newAuth.stsToken);
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
 * 阿里云 VOD 适配器
 *
 * 提供对阿里云 VOD（视频点播）的访问能力。
 *
 * @remarks
 * ### 核心特性
 * - 视频上传
 * - 视频信息查询
 * - 播放 URL 生成（支持多清晰度）
 * - STS 临时凭证（边缘上传）
 * - Token 自动刷新
 * - 转码模板和工作流支持
 *
 * ### 与 OSS 的关系
 * - VOD 适配器内部依赖 `fsd-oss` 的 `SimpleOSSClient` 进行文件上传
 * - 视频文件实际存储在 OSS 中
 * - VOD 提供转码、截图等视频处理服务
 *
 * ### 不支持的操作
 * - `mkdir()` - VOD 无目录概念
 * - `readdir()` - VOD 无目录列表
 * - `copy()` - VOD 不支持直接复制
 * - `rename()` - VOD 不支持重命名
 *
 * ### alloc() 机制
 * - 上传前必须先调用 `adapter.alloc({ name: 'video.mp4' })`
 * - 返回视频 ID 作为文件路径
 * - 视频 ID 格式：`/{VideoId}`
 * - 不能直接使用 `fsd('/path')`
 *
 * @example
 * ```typescript
 * import VODAdapter from 'fsd-vod';
 * import FSD from 'fsd';
 *
 * const adapter = new VODAdapter({
 *   accessKeyId: process.env.VOD_ACCESS_KEY_ID,
 *   accessKeySecret: process.env.VOD_ACCESS_KEY_SECRET,
 *   privateKey: process.env.VOD_PRIVATE_KEY
 * });
 *
 * const fsd = FSD({ adapter });
 *
 * // ✅ 正确：先分配视频 ID
 * const videoId = await adapter.alloc({ name: 'video.mp4' });
 * const file = fsd(videoId);
 * await file.write(videoData);
 *
 * // ❌ 错误：直接使用路径
 * const file = fsd('/uploads/video.mp4');  // 会创建新视频而非上传到指定 ID
 * await file.write(videoData);
 * ```
 */
export default class VODAdapter extends Adapter<VODAdapterOptions> {
  /**
   * 创建上传凭证
   *
   * 生成用于客户端直接上传到 VOD 的临时凭证。
   *
   * @param videoId - 视频 ID（由 `alloc()` 返回）
   * @param meta - 文件元数据（可选）
   * @param durationSeconds - 凭证有效期（秒），默认 3600（1 小时）
   * @returns 上传凭证对象
   *
   * @example
   * ```typescript
   * // 生成 1 小时有效的上传凭证
   * const token = await adapter.createUploadToken(
   *   '/1234567890abcdef',
   *   { contentType: 'video/mp4' },
   *   3600
   * );
   *
   * // 将 token 发送给前端
   * res.json({ uploadToken: token });
   * ```
   *
   * @remarks
   * 生成的凭证用于客户端直接上传到 OSS。
   * 上传完成后，VOD 会处理转码等操作。
   */
  createUploadToken: (
    videoId: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadToken>;

  /**
   * 创建带自动刷新的上传凭证
   *
   * 生成支持自动刷新 STS Token 的上传凭证。
   *
   * @param videoId - 视频 ID（由 `alloc()` 返回）
   * @param meta - 文件元数据（可选）
   * @param durationSeconds - 凭证有效期（秒），默认 3600（1 小时）
   * @returns 带自动刷新功能的上传凭证对象
   *
   * @example
   * ```typescript
   * const token = await adapter.createUploadTokenWithAutoRefresh(
   *   '/1234567890abcdef',
   *   { contentType: 'video/mp4' },
   *   3600
   * );
   *
   * // 当凭证快过期时，自动刷新
   * const newAuth = await token.auth.refreshSTSToken();
   * console.log(newAuth.stsToken);
   * ```
   *
   * @remarks
   * 适用于大文件上传，避免上传过程中凭证过期。
   * 使用 LRUCache 缓存 Token，减少刷新次数。
   */
  createUploadTokenWithAutoRefresh: (
    videoId: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;

  /**
   * 获取视频信息
   *
   * 查询视频的基本信息（标题、状态、时长等）。
   *
   * @param videoId - 视频 ID
   * @returns 视频信息，如果视频不存在则返回 null
   *
   * @example
   * ```typescript
   const info = await adapter.getVideoInfo('1234567890abcdef');
   if (info) {
   *   console.log('Title:', info.Title);
   *   console.log('Status:', info.Status);
   *   console.log('Duration:', info.Duration);
   * }
   * ```
   */
  getVideoInfo(videoId: string): Promise<null | VideoInfo>;

  /**
   * 获取视频媒体信息
   *
   * 查询视频转码后的媒体信息（不同清晰度）。
   *
   * @param videoId - 视频 ID
   * @param options - 可选参数
   * @returns 媒体信息，如果不存在则返回 null
   *
   * @example
   * ```typescript
   const mezzanineInfo = await adapter.getMezzanineInfo('1234567890abcdef');
   if (mezzanineInfo) {
   *   console.log('FileURL:', mezzanineInfo.FileURL);
   *   console.log('Duration:', mezzanineInfo.Duration);
   *   console.log('Size:', mezzanineInfo.Size);
   * }
   * ```
   */
  getMezzanineInfo(videoId: string, options?: any): Promise<null | MezzanineInfo>;

  /**
   * 获取视频播放信息
   *
   * 查询视频的播放配置信息（不同格式和清晰度的播放地址）。
   *
   * @param videoId - 视频 ID
   * @param options - 可选参数
   * @returns 播放信息结果
   *
   * @example
   * ```typescript
   * const playInfo = await adapter.getPlayInfo('1234567890abcdef');
   console.log('PlayInfoList:', playInfo.PlayInfoList);
   *
   // PlayInfoList 包含多种格式和清晰度
   // - Format: mp4, m3u8
   // - Definition: HD, SD, FHD, 4K
   * - PlayURL: 每种配置的播放地址
   * ```
   *
   * @remarks
   * 返回的信息可能包含多个清晰度（HD、SD、FHD、4K）的播放地址。
   * 可以根据用户网络和设备选择合适的清晰度。
   */
  getPlayInfo(videoId: string, options?: any): Promise<null | PlayInfoResult>;
}
