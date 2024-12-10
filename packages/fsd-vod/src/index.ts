import * as crypto from 'crypto';
import { PassThrough } from 'stream';
import { LRUCache } from 'lru-cache';
import * as Debugger from 'debug';
import * as RPC from '@alicloud/pop-core';
import akita from 'akita';
import type {
  ReadStreamOptions,
  WriteStreamOptions,
  Task,
  Part,
  AllocOptions,
  WithPromise,
  CreateUrlOptions
} from 'fsd';
import SimpleOSSClient from 'fsd-oss/simple-oss-client';
import type {
  VODAdapterOptions,
  VideoInfo,
  MezzanineInfo,
  PlayInfoResult,
  UploadToken,
  UploadTokenWithAutoRefresh
} from '..';

const debug = Debugger('fsd-vod');
const client = akita.resolve('fsd-vod');
const CALLBACK_BODY =
  // eslint-disable-next-line no-template-curly-in-string
  'bucket=${bucket}&path=${object}&etag=${etag}&size=${size}&mimeType=${mimeType}&height=${imageInfo.height}&width=${imageInfo.width}&format=${imageInfo.format}';

function parseToken(result: any): UploadToken {
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

function parseVideoId(id: string) {
  if (id[0] === '/') id = id.substring(1);
  let path = '';
  if (id.includes('#')) {
    [id, path] = id.split('#');
  }
  return { id, path };
}

function md5(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export default class VODAdapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
  _options: VODAdapterOptions;
  _rpc: RPC;
  _authCache: LRUCache<string, UploadToken>;
  _videoCache: LRUCache<string, VideoInfo>;
  alloc: (options?: AllocOptions) => Promise<string>;
  createUploadToken: (
    videoId: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadToken>;
  createUploadTokenWithAutoRefresh: (
    videoId: string,
    meta?: any,
    durationSeconds?: number
  ) => Promise<UploadTokenWithAutoRefresh>;

  constructor(options: VODAdapterOptions) {
    this.instanceOfFSDAdapter = true;
    this.name = 'VODAdapter';
    this.needEnsureDir = false;
    /* istanbul ignore if */
    if (!options.accessKeyId) throw new Error('option accessKeyId is required for fsd-vod');
    /* istanbul ignore if */
    if (!options.accessKeySecret) throw new Error('option accessKeySecret is required for fsd-vod');
    if (!options.publicRead && !options.privateKey)
      throw new Error('option privateKey is required when publicRead is false');

    this._options = options;

    this._authCache = new LRUCache({
      max: 1000,
      ttl: 1800000
    });
    this._videoCache = new LRUCache({
      max: 1000,
      ttl: 60000
    });

    this._rpc = new RPC({
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

      let result: any = await this._rpc.request('CreateUploadVideo', params, { method: 'POST' });
      if (result.Message) throw new Error(result.Message);

      let token = parseToken(result);
      this._authCache.set(result.VideoId, token, { ttl: token.expiration });

      return `/${result.VideoId}#${token.path}`;
    };

    this.createUploadToken = async (videoId: string, meta?: any, _durationSeconds?: number) => {
      let vid = parseVideoId(videoId);
      let token = this._authCache.get(vid.id);
      debug('getAuth', videoId, token);
      if (!token) {
        let params = {
          VideoId: vid.id
        };
        let result: any = await this._rpc.request('RefreshUploadVideo', params, { method: 'POST' });
        if (result.Message) throw new Error(result.Message);

        token = parseToken(result);

        this._authCache.set(vid.id, token, { ttl: token.expiration });
      }

      if (options.callbackUrl && meta) {
        token.callback = {
          url: options.callbackUrl,
          body:
            CALLBACK_BODY +
            Object.keys(meta || {})
              .map((key) => `&${key}=\${x:${key}}`)
              .join(''),
          contentType: 'application/x-www-form-urlencoded',
          customValue: meta
        };
      }

      return token;
    };

    this.createUploadTokenWithAutoRefresh = async (videoId: string, meta?: any) => {
      let token = await this.createUploadToken(videoId, meta);
      let auth = token.auth;
      auth = Object.assign({}, auth, {
        refreshSTSToken: async () => {
          let t = await this.createUploadToken(videoId, meta);
          return t.auth;
        }
      });
      return Object.assign({}, token, { auth }) as any;
    };
  }

  async getVideoInfo(videoId: string): Promise<null | VideoInfo> {
    let vid = parseVideoId(videoId);
    let cache = this._videoCache.get(vid.id);
    if (cache) return cache;

    let params: any = {
      VideoId: vid.id
    };

    try {
      let result: any = await this._rpc.request('GetVideoInfo', params, { method: 'POST' });
      if (result.Video) {
        this._videoCache.set(vid.id, result.Video);
        return result.Video;
      }
    } catch (_e) {}
    return null;
  }

  async getMezzanineInfo(videoId: string, options?: any): Promise<MezzanineInfo | null> {
    let vid = parseVideoId(videoId);

    let params: any = Object.assign(
      {
        VideoId: vid.id,
        OutputType: 'cdn'
      },
      options || {}
    );

    try {
      let result: any = await this._rpc.request('GetMezzanineInfo', params, { method: 'POST' });
      if (result.Mezzanine) {
        return result.Mezzanine;
      }
    } catch (_e) {}
    return null;
  }

  async getPlayInfo(videoId: string, options?: any): Promise<PlayInfoResult> {
    let vid = parseVideoId(videoId);

    let params: any = Object.assign(
      {
        VideoId: vid.id
      },
      options || {}
    );

    return await this._rpc.request('GetPlayInfo', params, { method: 'POST' });
  }

  async append(videoId: string, data: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    debug('append %s', videoId);
    let token = await this.createUploadTokenWithAutoRefresh(videoId);
    let oss = new SimpleOSSClient(token.auth);

    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    // 当前aliyun VOD+OSS不支持 AppendObject，只能调用PutObject接口
    await oss.put(token.path.substring(1), data);
  }

  async createReadStream(
    videoId: string,
    options?: ReadStreamOptions
  ): Promise<NodeJS.ReadableStream> {
    debug('createReadStream %s options: %o', videoId, options);
    let url = await this.createUrl(videoId);

    console.log('url', url);

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
    if (options?.start) throw new Error('fsd-vod read stream does not support start options');

    let token = await this.createUploadTokenWithAutoRefresh(videoId);
    let oss = new SimpleOSSClient(token.auth);

    let stream: NodeJS.WritableStream & WithPromise = new PassThrough();
    oss.put(token.path.substring(1), stream);
    return stream;
  }

  async initMultipartUpload(videoId: string, partCount: number): Promise<Task[]> {
    debug('initMultipartUpload %s, partCount: %d', videoId, partCount);
    let token = await this.createUploadTokenWithAutoRefresh(videoId);
    let oss = new SimpleOSSClient(token.auth);

    let { UploadId } = await oss.initMultipartUpload(token.path.substring(1));
    let files = [];
    for (let i = 1; i <= partCount; i += 1) {
      files.push(`task://${UploadId}?${i}`);
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
    if (!partTask.startsWith('task://')) throw new Error('Invalid part task id');

    let token = await this.createUploadTokenWithAutoRefresh(videoId);
    let oss = new SimpleOSSClient(token.auth);

    let [uploadId, no] = partTask.replace('task://', '').split('?');

    let res = await oss.uploadPart(token.path.substring(1), uploadId, parseInt(no), data, {
      headers: {
        'Content-Length': String(size)
      }
    });
    let etag = res.headers.get('ETag').replace(/"/g, '');
    return `${partTask.replace('task://', 'part://')}#${etag}`;
  }

  async completeMultipartUpload(videoId: string, parts: Part[]): Promise<void> {
    debug('completeMultipartUpload %s', videoId);
    let token = await this.createUploadTokenWithAutoRefresh(videoId);
    let oss = new SimpleOSSClient(token.auth);

    let uploadId = parts[0].replace('part://', '').split('?')[0];
    debug('update id: %s, target: %s', uploadId, token.path);
    let datas = parts.map((item, key) => ({
      etag: item.split('#')[1],
      number: key + 1
    }));
    await oss.completeMultipartUpload(token.path.substring(1), uploadId, datas);
  }

  async createUrl(videoId: string, options?: CreateUrlOptions): Promise<string> {
    debug('createUrl %s', videoId);
    options = options || {};
    let vid = parseVideoId(videoId);
    let path = options.path || vid.path;
    if (path && this._options.publicRead) {
      if (/^https?\:\/\//.test(path)) return path;
      return `${this._options.urlPrefix || ''}${path}`;
    }

    if (path) {
      let urlPrefix = this._options.urlPrefix || '';
      if (/^https?\:\/\//.test(path)) {
        let url = new URL(path);
        path = url.pathname;
        urlPrefix = url.origin;
      }
      let timestamp = parseInt((Date.now() / 1000) as any);
      let string = `${path}-${timestamp}-0-0-${this._options.privateKey}`;
      let hash = md5(string);
      return `${urlPrefix}${path}?auth_key=${timestamp}-0-0-${hash}`;
    }

    let info = await this.getMezzanineInfo(videoId, options);

    if (info) return info.FileURL;
    throw new Error('Video not exists!');
  }

  async unlink(videoId: string): Promise<void> {
    debug('unlink %s', videoId);
    let vid = parseVideoId(videoId);

    let params: any = {
      VideoIds: vid.id
    };

    let result: any = await this._rpc.request('DeleteVideo', params, { method: 'POST' });
    if (result.Message) throw new Error(result.Message);
    this._videoCache.delete(vid.id);
    this._authCache.delete(vid.id);
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
}
