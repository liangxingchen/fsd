import { Adapter } from 'fsd';

export interface VODAdapterOptions {
  urlPrefix?: string;
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

export default class VODAdpter extends Adapter<VODAdapterOptions> {
  getVideoInfo(videoId: string): Promise<null | VideoInfo>;
  getMezzanineInfo(videoId: string, options?: any): Promise<null | MezzanineInfo>;
  getPlayInfo(videoId: string, options?: any): Promise<null | PlayInfoResult>;
}
