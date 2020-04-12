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
}

export default class OSSAdpter extends Adapter<OSSAdapterOptions> {}
