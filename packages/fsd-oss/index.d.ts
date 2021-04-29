import { Adapter } from 'fsd';

export interface OSSAdapterOptions {
  root?: string;
  urlPrefix?: string;
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
  createUploadToken: (videoId: string, meta?: any) => Promise<UploadToken>;
  createUploadTokenWithAutoRefresh: (
    videoId: string,
    meta?: any
  ) => Promise<UploadTokenWithAutoRefresh>;
}
