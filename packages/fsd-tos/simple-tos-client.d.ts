import type { Request } from 'akita';

export default class SimpleTOSClient {
  config: SimpleTOSClientConfig;
  endpoint: string;

  constructor(config: SimpleTOSClientConfig);

  append(key: string, body: any, offset: number, options?: RequestOptions): Promise<Result>;

  get(key: string, options?: RequestOptions): Request<any>;

  put(key: string, body: any, options?: RequestOptions): Promise<Result>;

  head(key: string, options?: RequestOptions): Promise<Result>;

  del(key: string, options?: RequestOptions): Promise<Result>;

  deleteMultiObjects(
    objects: Array<{ key: string }>,
    options?: RequestOptions & { quiet?: boolean }
  ): Promise<Result>;

  listObjectsType2(options: ListOptions): Promise<ListResult>;

  copyObject(
    key: string,
    srcBucket: string,
    srcKey: string,
    options?: RequestOptions
  ): Promise<Result>;

  createMultipartUpload(
    key: string,
    options?: RequestOptions
  ): Promise<InitiateMultipartUploadResult>;

  uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: any,
    options?: RequestOptions
  ): Promise<Result>;

  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; eTag: string }>,
    options?: RequestOptions
  ): Promise<CompleteMultipartUploadResult>;

  getPreSignedUrl(key: string, options?: SignatureUrlOptions): string;

  request(method: string, resource: string, body?: any, options?: RequestOptions): Request<any>;

  requestData(method: string, resource: string, body?: any, options?: RequestOptions): Promise<any>;
}

export interface SimpleTOSClientConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  region: string;
  stsToken?: string;
  timeout?: number;
}

export interface RequestOptions {
  timeout?: number;
  mime?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface Result {
  headers: Headers;
  [key: string]: any;
}

export interface ListOptions {
  prefix?: string;
  delimiter?: string;
  continuationToken?: string;
  maxKeys?: number;
}

export interface ListResult {
  Name: string;
  Prefix: string;
  MaxKeys: number;
  IsTruncated: boolean;
  KeyCount: number;
  NextContinuationToken?: string;
  Contents: ListResultContent[];
  CommonPrefixes: ListResultCommonPrefixes[];
}

export interface ListResultContent {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
  Owner?: {
    ID: string;
    DisplayName: string;
  };
}

export interface ListResultCommonPrefixes {
  Prefix: string;
}

export interface InitiateMultipartUploadResult extends Result {
  Bucket: string;
  Key: string;
  UploadId: string;
}

export interface CompleteMultipartUploadResult extends Result {
  Location: string;
  Bucket: string;
  Key: string;
  ETag: string;
}

export interface SignatureUrlOptions {
  expires?: number;
  method?: string;
  response?: Record<string, string>;
}

export interface AssumeRoleResult {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: {
      Code: string;
      Message: string;
    };
  };
  Result?: {
    Credentials: {
      AccessKeyId: string;
      SecretAccessKey: string;
      SessionToken: string;
      ExpiredTime: string;
    };
  };
}

export function assumeRole(
  accessKeyId: string,
  secretKey: string,
  params: {
    RoleTrn: string;
    RoleSessionName: string;
    Policy: string;
    DurationSeconds: number;
  }
): Promise<AssumeRoleResult>;
