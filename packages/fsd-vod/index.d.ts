import { Adapter } from 'fsd';

declare namespace VODAdpter {
  interface VODAdapterOptions {
    urlPrefix?: string;
    accessKeyId: string;
    accessKeySecret: string;
    region?: string;
    templateGroupId?: string;
    workflowId?: string;
  }

  interface VideoInfo {
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

  interface MezzanineInfo {
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

  interface VideoBase {
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

  interface PlayInfo {
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

  interface PlayInfoResult {
    RequestId: string;
    VideoBase: VideoBase;
    PlayInfoList: {
      PlayInfo: PlayInfo[];
    };
  }
}

// eslint-disable-next-line no-redeclare
declare class VODAdpter extends Adapter<VODAdpter.VODAdapterOptions> {
  getVideoInfo(videoId: string): Promise<null | VODAdpter.VideoInfo>;
  getMezzanineInfo(videoId: string, options?: any): Promise<null | VODAdpter.MezzanineInfo>;
  getPlayInfo(videoId: string, options?: any): Promise<null | VODAdpter.PlayInfoResult>;
}

export = VODAdpter;
