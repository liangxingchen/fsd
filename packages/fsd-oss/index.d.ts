import { Adapter } from 'fsd';

export interface OSSAdapterOptions {
  root?: string;
  urlPrefix?: string;
  /**
   * 是否公开读，默认为false
   */
  publicRead?: boolean;
  // 以下为OSS驱动配置
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  internal?: boolean;
  secure?: boolean;
  timeout?: string | number;
  // 角色扮演
  accountId?: string;
  roleName?: string;
  callbackUrl?: string; // 边缘上传回调地址
  /**
   * 缩略图配置
   */
  thumbs?: {
    // name -> ?x-oss-process=style/stylename
    [name: string]: string;
  };
}

export interface UploadToken {
  auth: {
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
    bucket: string;
    endpoint: string;
  };
  path: string;
  expiration: number;
  callback?: any;
}

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
  expiration: number;
  callback?: any;
}

export default class OSSAdpter extends Adapter<OSSAdapterOptions> {
  /**
   * 创建上传凭证
   * @param {string} path 文件路径
   * @param {any} [meta] 文件元信息
   * @param {number} [durationSeconds] 上传凭证有效期，单位秒, 默认 3600
   */
  createUploadToken: (path: string, meta?: any, durationSeconds?: number) => Promise<UploadToken>;

  /**
   * 创建带自动刷新的上传凭证
   * @param {string} path 文件路径
   * @param {any} [meta] 文件元信息
   * @param {number} [durationSeconds] 上传凭证有效期，单位秒, 默认 3600
   */
  createUploadTokenWithAutoRefresh: (
    path: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;
}
