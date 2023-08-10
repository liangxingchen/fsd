import { Adapter } from 'fsd';

export interface VODAdapterOptions {
  urlPrefix?: string;
  /**
   * 是否公开读，默认为false
   */
  publicRead?: boolean;
  /**
   * 非公开读时，生成URL时的鉴权秘钥
   */
  privateKey?: string;
  accessKeyId: string;
  accessKeySecret: string;
  region?: string;
  templateGroupId?: string;
  workflowId?: string;
  callbackUrl?: string;
}

export interface VideoInfo {
  AuditStatus: string;
  DownloadSwitch: string;
  PreprocessStatus: string;
  ModificationTime: string;
  VideoId: string;
  AppId: string;
  ModifyTime: string;
  Title: string;
  CreationTime: string;
  Status: string;
  TemplateGroupId: string;
  RegionId: string;
  Duration: number;
  CreateTime: string;
  Snapshots: { Snapshot: string[] };
  StorageLocation: string;
  Size: number;
}

export interface MezzanineInfo {
  PreprocessStatus: string;
  VideoId: string;
  OutputType: string;
  CRC64: string;
  CreationTime: string;
  Status: string;
  FileName: string;
  Duration: string;
  Height: number;
  Width: number;
  Fps: string;
  Bitrate: string;
  FileURL: string;
  Size: number;
}

export interface VideoBase {
  TranscodeMode: string;
  CreationTime: string;
  CoverURL: string;
  Status: string;
  MediaType: string;
  VideoId: string;
  Duration: string;
  OutputType: string;
  Title: string;
}

export interface PlayInfo {
  Format: string;
  StreamType: string;
  PreprocessStatus: string;
  ModificationTime: string;
  Specification: string;
  Height: number;
  PlayURL: string;
  NarrowBandType: string;
  CreationTime: string;
  Status: string;
  Duration: string;
  JobId: string;
  Encrypt: number;
  Width: number;
  Fps: string;
  Bitrate: string;
  Size: number;
  Definition: string;
}

export interface PlayInfoResult {
  RequestId: string;
  VideoBase: VideoBase;
  PlayInfoList: {
    PlayInfo: PlayInfo[];
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

export default class VODAdpter extends Adapter<VODAdapterOptions> {
  /**
   * 创建上传凭证
   * @param {string} videoId 视频ID
   * @param {any} [meta] 文件元信息
   * @param {number} [durationSeconds] 上传凭证有效期，单位秒, 默认 3600
   */
  createUploadToken: (
    videoId: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadToken>;

  /**
   * 创建带自动刷新的上传凭证
   * @param {string} videoId 视频ID
   * @param {any} [meta] 文件元信息
   * @param {number} [durationSeconds] 上传凭证有效期，单位秒, 默认 3600
   */
  createUploadTokenWithAutoRefresh: (
    videoId: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;

  /**
   * 获取视频信息
   * @param {string} videoId 视频ID
   */
  getVideoInfo(videoId: string): Promise<null | VideoInfo>;

  /**
   * 获取视频播放信息
   * @param {string} videoId 视频ID
   * @param {any} [options] 参数选项
   */
  getMezzanineInfo(videoId: string, options?: any): Promise<null | MezzanineInfo>;

  /**
   * 获取视频播放信息
   * @param {string} videoId 视频ID
   * @param {any} [options] 参数选项
   */
  getPlayInfo(videoId: string, options?: any): Promise<null | PlayInfoResult>;
}
