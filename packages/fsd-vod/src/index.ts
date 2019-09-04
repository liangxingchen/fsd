import * as OSS from 'ali-oss';
import * as LRUCache from 'lru-cache';
import * as Debugger from 'debug';
import * as Core from '@alicloud/pop-core';
import { URL } from 'url';
import { PassThrough } from 'stream';
import akita from 'akita';
import { ReadStreamOptions, WriteStreamOptions, Task, Part, AllocOptions, WithPromise } from 'fsd';
import { VODAdapterOptions, VideoInfo, MezzanineInfo, PlayInfoResult } from '..';

const debug = Debugger('fsd-vod');
const client = akita.resolve('fsd-vod');

interface AuthCache {
  auth: {
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
    bucket: string;
    endpoint: string;
  };
  path: string;
  expiration: number;
}

function resultToCache(result: any): AuthCache {
  let UploadAddress = JSON.parse(Buffer.from(result.UploadAddress, 'base64').toString());
  let UploadAuth = JSON.parse(Buffer.from(result.UploadAuth, 'base64').toString());

  return {
    auth: {
      accessKeyId: UploadAuth.AccessKeyId,
      accessKeySecret: UploadAuth.AccessKeySecret,
      stsToken: UploadAuth.SecurityToken,
      bucket: UploadAddress.Bucket,
      endpoint: UploadAddress.Endpoint
    },
    path: `/${UploadAddress.FileName}`,
    expiration: UploadAuth.Expiration * 950
  };
}

module.exports = class VODAdapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
  _options: VODAdapterOptions;
  _vod: Core;
  _authCache: LRUCache<string, AuthCache>;
  _videoCache: LRUCache<string, VideoInfo>;
  alloc?: (options?: AllocOptions) => Promise<string>;

  constructor(options: VODAdapterOptions) {
    this.instanceOfFSDAdapter = true;
    this.name = 'VODAdapter';
    this.needEnsureDir = false;
    /* istanbul ignore if */
    if (!options.accessKeyId) throw new Error('option accessKeyId is required for fsd-vod');
    /* istanbul ignore if */
    if (!options.accessKeySecret) throw new Error('option accessKeySecret is required for fsd-vod');

    this._options = options;

    this._authCache = new LRUCache({
      max: 1000,
      maxAge: 1800000
    });
    this._videoCache = new LRUCache({
      max: 1000,
      maxAge: 60000
    });

    this._vod = new Core({
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      endpoint: `https://vod.${options.region || 'cn-shanghai'}.aliyuncs.com`,
      apiVersion: '2017-03-21'
    });

    this.alloc = async (info?: AllocOptions) => {
      info = info || {};
      let params: any = {
        Title: info.Title || info.name,
        FileName: info.FileName || info.name
      };
      if (info.size) params.FileSIze = info.size;
      if (info.FileSIze) params.FileSIze = info.FileSIze;
      if (this._options.templateGroupId) params.TemplateGroupId = this._options.templateGroupId;
      if (this._options.workflowId) params.WorkflowId = this._options.workflowId;
      if (info.TemplateGroupId) params.TemplateGroupId = info.TemplateGroupId;
      if (info.WorkflowId) params.WorkflowId = info.WorkflowId;
      if (info.Tags) params.Tags = info.Tags;
      if (info.UserData) params.UserData = info.UserData;

      let result: any = await this._vod.request('CreateUploadVideo', params, { method: 'POST' });
      if (result.Message) throw new Error(result.Message);

      let cache = resultToCache(result);
      this._authCache.set(result.VideoId, cache, cache.expiration);

      return result.VideoId;
    };
  }

  async getUploadAuth(videoId: string): Promise<AuthCache> {
    if (videoId[0] === '/') videoId = videoId.substr(1);
    let cache = this._authCache.get(videoId);
    debug('getAuth', videoId, cache);
    if (cache) return cache;

    let params = {
      VideoId: videoId
    };
    let result: any = await this._vod.request('RefreshUploadVideo', params, { method: 'POST' });
    if (result.Message) throw new Error(result.Message);

    cache = resultToCache(result);
    this._authCache.set(videoId, cache, cache.expiration);

    return cache;
  }

  async getVideoInfo(videoId: string): Promise<null | VideoInfo> {
    if (videoId[0] === '/') videoId = videoId.substr(1);
    let cache = this._videoCache.get(videoId);
    if (cache) return cache;

    let params: any = {
      VideoId: videoId
    };

    try {
      let result: any = await this._vod.request('GetVideoInfo', params, { method: 'POST' });
      if (result.Video) {
        this._videoCache.set(videoId, result.Video);
        return result.Video;
      }
    } catch (e) {}
    return null;
  }

  async getMezzanineInfo(videoId: string, options?: any): Promise<MezzanineInfo | null> {
    if (videoId[0] === '/') videoId = videoId.substr(1);

    let params: any = Object.assign(
      {
        VideoId: videoId,
        OutputType: 'cdn'
      },
      options || {}
    );

    try {
      let result: any = await this._vod.request('GetMezzanineInfo', params, { method: 'POST' });
      if (result.Mezzanine) {
        return result.Mezzanine;
      }
    } catch (e) {}
    return null;
  }

  async getPlayInfo(videoId: string, options?: any): Promise<PlayInfoResult> {
    if (videoId[0] === '/') videoId = videoId.substr(1);

    let params: any = Object.assign(
      {
        VideoId: videoId
      },
      options || {}
    );

    return await this._vod.request('GetPlayInfo', params, { method: 'POST' });
  }

  async append(videoId: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    debug('append %s', videoId);
    let cache = await this.getUploadAuth(videoId);
    let oss = new OSS(cache.auth);

    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    let options: OSS.PutObjectOptions = {};
    await oss.put(cache.path.substr(1), data, options);
  }

  async createReadStream(
    videoId: string,
    options?: ReadStreamOptions
  ): Promise<NodeJS.ReadableStream> {
    debug('createReadStream %s options: %o', videoId, options);
    let url = await this.createUrl(videoId);

    let headers: any = {};
    if (options) {
      let start = options.start || 0;
      let end = options.end || 0;
      let Range = '';
      if (start && !end) {
        Range = `${start}-`;
      } else if (end) {
        Range = `${start}-${end}`;
      }
      if (Range) {
        headers.Range = `bytes=${Range}`;
      }
    }

    // @ts-ignore
    return client.get(url, { headers }).stream() as NodeJS.ReadableStream;
  }

  async createWriteStream(
    videoId: string,
    options?: WriteStreamOptions
  ): Promise<NodeJS.WritableStream & WithPromise> {
    debug('createWriteStream %s', videoId);
    if (options && options.start)
      throw new Error('fsd-vod read stream does not support start options');

    let cache = await this.getUploadAuth(videoId);
    let oss = new OSS(cache.auth);

    let stream: NodeJS.WritableStream & WithPromise = new PassThrough();
    stream.promise = oss.putStream(cache.path.substr(1), stream);
    return stream;
  }

  async initMultipartUpload(videoId: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', videoId, partCount);
    let cache = await this.getUploadAuth(videoId);
    let oss = new OSS(cache.auth);

    let res = await oss.initMultipartUpload(cache.path.substr(1));
    let { uploadId } = res;
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push(`task://${uploadId}${cache.path}?${i}`);
    }
    return files;
  }

  async writePart(
    videoId: string,
    partTask: Task,
    data: NodeJS.ReadableStream,
    size: number
  ): Promise<Part> {
    debug('writePart %s, task: %s', videoId, partTask);
    let cache = await this.getUploadAuth(videoId);
    let oss = new OSS(cache.auth);

    let info = new URL(partTask);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== cache.path) throw new Error('Invalid part pathname');
    let uploadId = (info.hostname || '').toUpperCase();
    // @ts-ignore _uploadPart
    let res = await oss._uploadPart(cache.path.substr(1), uploadId, info.search.substr(1), {
      stream: data,
      size
    });
    let etag = res.etag.replace(/"/g, '');
    return `${partTask.replace('task://', 'part://')}#${etag}`;
  }

  async completeMultipartUpload(videoId: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', videoId);
    let cache = await this.getUploadAuth(videoId);
    let oss = new OSS(cache.auth);

    let info = new URL(parts[0]);
    /* istanbul ignore if */
    if (!info.pathname || info.pathname !== cache.path) throw new Error('Invalid part pathname');
    let uploadId = (info.hostname || '').toUpperCase();
    debug('update id: %s, target: %s', uploadId, cache.path);
    let datas = parts.map((item, key) => ({
      etag: item.split('#')[1],
      number: key + 1
    }));
    await oss.completeMultipartUpload(cache.path.substr(1), uploadId, datas);
  }

  async createUrl(videoId: string, options?: any): Promise<string> {
    debug('createUrl %s', videoId);
    let info = await this.getMezzanineInfo(videoId, options);

    if (info) return info.FileURL;
    throw new Error('Video not exists!');
  }

  async unlink(videoId: string): Promise<void> {
    debug('unlink %s', videoId);
    if (videoId[0] === '/') videoId = videoId.substr(1);

    let params: any = {
      VideoIds: videoId
    };

    let result: any = await this._vod.request('DeleteVideo', params, { method: 'POST' });
    if (result.Message) throw new Error(result.Message);
  }

  async exists(videoId: string): Promise<boolean> {
    return !!(await this.getVideoInfo(videoId));
  }

  isFile(videoId: string): Promise<boolean> {
    return this.exists(videoId);
  }

  isDirectory() {
    return Promise.resolve(false);
  }

  async size(videoId: string): Promise<number> {
    let video = await this.getVideoInfo(videoId);
    if (video) return video.Size;
    throw new Error('Video not exists!');
  }

  async lastModified(videoId: string): Promise<Date> {
    let video = await this.getVideoInfo(videoId);
    if (video) return new Date(video.ModificationTime);
    throw new Error('Video not exists!');
  }

  mkdir() {
    throw new Error(`fsd-vod deos not support mkdir()`);
  }
  readdir() {
    throw new Error(`fsd-vod deos not support readdir()`);
  }
  copy() {
    throw new Error(`fsd-vod deos not support copy()`);
  }
  rename() {
    throw new Error(`fsd-vod deos not support rename()`);
  }
};
