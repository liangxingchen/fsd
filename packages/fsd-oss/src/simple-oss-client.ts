import * as qs from 'qs';
import * as xml2js from 'xml2js';
import * as sha1 from 'crypto-js/hmac-sha1';
import * as md5 from 'crypto-js/md5';
import * as Base64Encoder from 'crypto-js/enc-base64';
import * as mime from 'mime-types';
import akita from 'akita';
import type { Request } from 'akita';
import type {
  SimpleOSSClientConfig,
  RequestOptions,
  Result,
  AppendOptions,
  CopyResult,
  ListOptions,
  ListResult,
  DeleteMultiOptions,
  DeleteMultiResult,
  InitiateMultipartUploadResult,
  CompleteMultipartUploadResult,
  SignatureUrlOptions
} from '../simple-oss-client';

const client = akita.create({});

export default class SimpleOSSClient {
  config: SimpleOSSClientConfig;
  endpoint: string;

  constructor(config: SimpleOSSClientConfig) {
    this.config = config;
    if (/^https?:/.test(config.endpoint)) {
      let url = new URL(config.endpoint);
      this.endpoint = url.host;
    } else {
      this.endpoint = config.endpoint;
    }
  }

  append(name: string, body: any, options?: AppendOptions): Promise<Result> {
    options = options || {};
    let position = options.position || 0;
    if (!options.mime) options.mime = mime.lookup(name) || 'application/octet-stream';
    return this.requestData('POST', `${name}?append&position=${position}`, body, options);
  }

  get(name: string, options?: RequestOptions): Request<any> {
    return this.request('GET', name, null, options);
  }

  put(name: string, body: any, options?: RequestOptions): Promise<Result> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(name) || 'application/octet-stream';
    return this.requestData('PUT', name, body, options);
  }

  async copy(to: string, from: string, options?: RequestOptions): Promise<CopyResult> {
    options = options || {};
    if (!options.headers) options.headers = {};
    options.headers['x-oss-copy-source'] = `/${this.config.bucket}/${from}`;
    let res = await this.requestData('PUT', to, null, options);

    // res = Object.assign({ headers: res.headers }, res.CopyObjectResult);
    return res;
  }

  async head(name: string, options?: RequestOptions): Promise<Result> {
    let response = await this.request('HEAD', name, null, options).response();
    if (response.status === 404) {
      throw new Error('NoSuchKey');
    }
    if (response.status !== 200) {
      throw new Error(response.statusText);
    }
    return { headers: response.headers };
  }

  async list(options: ListOptions): Promise<ListResult> {
    let query: Record<string, string> = {
      'list-type': '2'
    };
    let subres: Record<string, string> = {};
    if (options.prefix) query.prefix = options.prefix;
    if (options.delimiter) query.delimiter = options.delimiter;
    if (options.startAfter) query['start-after'] = options.startAfter;
    if (options.continuationToken) subres['continuation-token'] = options.continuationToken;
    if (options.maxKeys) query['max-keys'] = String(options.maxKeys);
    if (options.encodingType) query['encoding-type'] = options.encodingType;
    if (options.fetchOwner) query['fetch-owner'] = String(options.fetchOwner);

    options.query = query;
    options.subres = subres;
    let res = await this.requestData('GET', '', null, options);
    // res = Object.assign({ headers: res.headers }, res.ListBucketResult);

    res.KeyCount = parseInt(res.KeyCount);
    res.MaxKeys = parseInt(res.MaxKeys);
    res.IsTruncated = res.IsTruncated === 'true';
    res.Prefix = res.Prefix || '';
    if (res.Contents) {
      if (!Array.isArray(res.Contents)) res.Contents = [res.Contents];
      res.Contents.forEach((content: any) => {
        content.Size = parseInt(content.Size);
      });
    }
    if (res.CommonPrefixes) {
      if (!Array.isArray(res.CommonPrefixes)) res.CommonPrefixes = [res.CommonPrefixes];
    }

    return res;
  }

  del(name: string, options?: RequestOptions): Promise<Result> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(name) || 'application/octet-stream';
    return this.requestData('DELETE', name, null, options);
  }

  async deleteMulti(names: string[], options?: DeleteMultiOptions): Promise<DeleteMultiResult> {
    options = options || {};

    let body = `<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>${
      options.quiet || false
    }</Quiet>${names.map((name) => `<Object><Key>${name}</Key></Object>`).join('')}</Delete>`;

    if (!options.mime) options.mime = 'application/xml';
    if (!options.headers) options.headers = {};
    options.headers['Content-MD5'] = md5(body).toString(Base64Encoder);

    let res = await this.requestData('POST', '?delete', body, options);
    // res = Object.assign({ headers: res.headers }, res.DeleteResult);

    if (res.Deleted) {
      if (!Array.isArray(res.Deleted)) res.Deleted = [res.Deleted];
      res.Deleted.forEach((deleted: any) => {
        if (deleted.DeleteMarker) deleted.DeleteMarker = deleted.DeleteMarker === 'true';
      });
    }
    return res;
  }

  async initMultipartUpload(
    name: string,
    options?: RequestOptions
  ): Promise<InitiateMultipartUploadResult> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(name) || 'application/octet-stream';
    return await this.requestData('POST', `${name}?uploads`, '', options);
  }

  uploadPart(
    name: string,
    uploadId: string,
    partNumber: number,
    body: any,
    options?: RequestOptions
  ): Promise<Result> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(name) || 'application/octet-stream';
    return this.requestData(
      'PUT',
      `${name}?partNumber=${partNumber}&uploadId=${uploadId}`,
      body,
      options
    );
  }

  async completeMultipartUpload(
    name: string,
    uploadId: string,
    parts: Array<{ number: number; etag: string }>,
    options?: RequestOptions
  ): Promise<CompleteMultipartUploadResult> {
    options = options || {};
    options.mime = 'application/xml';
    let body = `<?xml version="1.0" encoding="UTF-8"?>\n<CompleteMultipartUpload>${parts
      .map(
        (part) => `<Part><PartNumber>${part.number}</PartNumber><ETag>${part.etag}</ETag></Part>`
      )
      .join('')}</CompleteMultipartUpload>`;
    let res = await this.requestData('POST', `${name}?uploadId=${uploadId}`, body, options);
    // res = Object.assign({ headers: res.headers }, res.CompleteMultipartUploadResult);
    return res;
  }

  request(method: string, resource: string, body?: any, options?: RequestOptions): Request<any> {
    options = options || {};
    let headers = options.headers || {};
    if (options.mime) {
      headers['Content-Type'] = options.mime;
    }
    if (options.meta) {
      Object.keys(options.meta).forEach((key) => {
        headers[`x-oss-meta-${key}`] = String(options.meta[key]);
      });
    }
    headers['x-oss-date'] = new Date().toUTCString();
    if (this.config.stsToken) {
      headers['x-oss-security-token'] = this.config.stsToken;
    }
    let canonicalizedResource = this.createCanonicalizedResource(
      `/${this.config.bucket}/${resource}`,
      options.subres
    );
    headers.authorization = this.getSign(method, canonicalizedResource, headers);
    let url = `https://${this.config.bucket}.${this.endpoint}/${resource}`;
    let query = Object.assign({}, options.query, options.subres);
    return client.request(url, {
      method,
      headers,
      query,
      body,
      timeout: options.timeout || this.config.timeout || 60000
    });
  }

  async requestData(
    method: string,
    resource: string,
    body?: any,
    options?: RequestOptions
  ): Promise<any> {
    let response = await this.request(method, resource, body, options).response();

    let xml = await response.text();

    if (!xml && (response.status === 200 || response.status === 204)) {
      return {
        headers: response.headers
      };
    }

    let data: any = await xml2js.parseStringPromise(xml, {
      trim: true,
      explicitArray: false,
      explicitRoot: false
    });
    // console.log('xml', xml);
    // console.log('data', data);
    if (data.Code) {
      throw new Error(data.Message);
    }

    let res = Object.assign({ headers: response.headers }, data);
    return res;
  }

  signatureUrl(name: string, options?: SignatureUrlOptions): string {
    options = options || {};
    let expires = parseInt((Date.now() / 1000 + (options.expires || 3600)) as any);
    let response = options.response || {};
    let url = `https://${this.config.bucket}.${this.endpoint}/${name}`;
    let query: any = Object.assign({}, options.query);
    if (options.trafficLimit) {
      query['x-oss-traffic-limit'] = options.trafficLimit;
    }
    if (options.response) {
      Object.keys(response).forEach((key) => {
        query[`response-${key}`] = response[key];
      });
    }
    if (this.config.stsToken) {
      query['security-token'] = this.config.stsToken;
    }
    let parts = [options.method || 'GET', '', '', String(expires)];
    let string = qs.stringify(query);
    parts.push(`/${this.config.bucket}/${name}${string ? `?${string}` : ''}`);
    query.Signature = sha1(parts.join('\n'), this.config.accessKeySecret).toString(Base64Encoder);
    query.OSSAccessKeyId = this.config.accessKeyId;
    query.Expires = expires;
    return `${url}?${qs.stringify(query)}`;
  }

  createCanonicalizedResource(resource: string, subres: Record<string, string>) {
    if (!subres) return resource;
    let string = Object.keys(subres)
      .sort()
      .map((key) => `${key}=${subres[key]}`)
      .join('&');
    if (string) return `${resource}?${string}`;
    return resource;
  }

  getSign(method: string, canonicalizedResource: string, headers?: any) {
    headers = headers || {};
    let parts = [
      method,
      headers['Content-MD5'] || '',
      headers['Content-Type'] || '',
      headers['x-oss-date'] || new Date().toUTCString()
    ];
    Object.keys(headers)
      .sort()
      .forEach((key) => {
        if (key.startsWith('x-oss-')) parts.push(`${key}:${headers[key]}`);
      });
    parts.push(canonicalizedResource);
    let sign = sha1(parts.join('\n'), this.config.accessKeySecret).toString(Base64Encoder);
    return `OSS ${this.config.accessKeyId}:${sign}`;
  }
}
