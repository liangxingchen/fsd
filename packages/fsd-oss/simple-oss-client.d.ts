import type { Request } from 'akita';

export default class SimpleOSSClient {
  config: SimpleOSSClientConfig;
  endpoint: string;

  constructor(config: SimpleOSSClientConfig);

  append(name: string, body: any, options?: AppendOptions): Promise<Result>;

  get(name: string, options?: RequestOptions): Request<any>;

  put(name: string, body: any, options?: RequestOptions): Promise<Result>;

  copy(to: string, from: string, options?: RequestOptions): Promise<CopyResult>;

  head(name: string, options?: RequestOptions): Promise<Result>;

  list(options: ListOptions): Promise<ListResult>;

  del(name: string, options?: RequestOptions): Promise<Result>;

  deleteMulti(names: string[], options?: DeleteMultiOptions): Promise<DeleteMultiResult>;

  initMultipartUpload(
    name: string,
    options?: RequestOptions
  ): Promise<InitiateMultipartUploadResult>;

  uploadPart(
    name: string,
    uploadId: string,
    partNumber: number,
    body: any,
    options?: RequestOptions
  ): Promise<Result>;

  completeMultipartUpload(
    name: string,
    uploadId: string,
    parts: Array<{ number: number; etag: string }>,
    options?: RequestOptions
  ): Promise<CompleteMultipartUploadResult>;

  request(method: string, resource: string, body?: any, options?: RequestOptions): Request<any>;

  requestData(method: string, resource: string, body?: any, options?: RequestOptions): Promise<any>;

  signatureUrl(name: string, options?: SignatureUrlOptions): string;
}

export interface SimpleOSSClientConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  stsToken?: string;
  timeout?: number;
}

export interface RequestOptions {
  timeout?: number;
  mime?: string;
  meta?: UserMeta;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  subres?: Record<string, string>;
}

export interface Result {
  headers: Headers;
}

export interface UserMeta extends Record<string, string | number> {
  uid: number;
  pid: number;
}

export interface AppendOptions extends RequestOptions {
  position?: number;
}

export interface CopyResult extends Result {
  ETag: string;
  LastModified: string;
}

export interface ListOptions extends RequestOptions {
  prefix?: string;
  delimiter?: string;
  startAfter?: string;
  continuationToken?: string;
  maxKeys?: number;
  encodingType?: string;
  fetchOwner?: boolean;
}

export interface ListResult extends Result {
  Name: string;
  Prefix: string;
  StartAfter: string;
  MaxKeys: number;
  EncodingType: string;
  IsTruncated: boolean;
  KeyCount: number;
  NextContinuationToken?: string;
  Contents: ListResultContent[];
}

export interface ListResultContent {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
  Owner: {
    ID: string;
    DisplayName: string;
  };
}

export interface DeleteMultiOptions extends RequestOptions {
  quiet?: boolean;
}

export interface DeleteMultiResult extends Result {
  Deleted: Deleted[];
}

export interface Deleted {
  Key: string;
  DeleteMarker?: boolean;
  DeleteMarkerVersionId?: string;
  VersionId?: string;
}

export interface InitiateMultipartUploadResult extends Result {
  Bucket: string;
  Key: string;
  UploadId: string;
}

export interface CompleteMultipartUploadResult extends Result {
  EncodingType: string;
  Location: string;
  Bucket: string;
  Key: string;
  ETag: string;
}

export interface SignatureUrlOptions {
  /**
   * 连接过期时间，单位秒，默认为 1800 秒
   */
  expires?: number;
  /**
   * 请求方法，默认为 GET
   */
  method?: string;
  /**
   * 限速 x-oss-traffic-limit
   */
  trafficLimit?: number;
  /**
   * 返回头信息
   */
  response?: {
    [key: string]: string;
  };
  /**
   * 其他查询参数
   */
  query?: {
    [key: string]: string;
  };
}
