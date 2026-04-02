import Crypto from 'crypto';
import xml2js from 'xml2js';
import mime from 'mime-types';
import akita from 'akita';
import type { Request } from 'akita';
import type {
  SimpleTOSClientConfig,
  RequestOptions,
  Result,
  ListOptions,
  ListResult,
  InitiateMultipartUploadResult,
  CompleteMultipartUploadResult,
  SignatureUrlOptions,
  AssumeRoleResult
} from '../simple-tos-client';

const client = akita.create({});

const ALGORITHM = 'TOS4-HMAC-SHA256';
const SERVICE_NAME = 'tos';
const V4_IDENTIFIER = 'request';

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return Crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hashSha256(data: string): string {
  return Crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function getDateTime(): string {
  const date = new Date(new Date().toUTCString());
  return date
    .toISOString()
    .replace(/\.\d+Z/, 'Z')
    .replace(/-/g, '')
    .replace(/:/g, '');
}

function getDate(datetime: string): string {
  return datetime.substr(0, 8);
}

function createScope(date: string, region: string): string {
  return [date, region, SERVICE_NAME, V4_IDENTIFIER].join('/');
}

function getSigningKey(secretKey: string, date: string, region: string): Buffer {
  const kDate = hmacSha256(secretKey, date);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, SERVICE_NAME);
  return hmacSha256(kService, V4_IDENTIFIER);
}

function getSignedHeaders(headers: Record<string, string>): string {
  return Object.keys(headers)
    .map((k) => k.toLowerCase())
    .filter((k) => k === 'host' || k.startsWith('x-tos-'))
    .sort()
    .join(';');
}

function getCanonicalHeaders(headers: Record<string, string>): string {
  return Object.keys(headers)
    .map((k) => [k.toLowerCase(), headers[k]])
    .filter(([k]) => k === 'host' || k.startsWith('x-tos-'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.replace(/\s+/g, ' ').trim()}`)
    .join('\n');
}

// eslint-disable-next-line max-params
function signRequest(
  method: string,
  path: string,
  query: string,
  headers: Record<string, string>,
  region: string,
  accessKeyId: string,
  secretKey: string
): string {
  const datetime = headers['x-tos-date'] || getDateTime();
  const date = getDate(datetime);
  const credentialScope = createScope(date, region);

  const bodyHash = headers['x-tos-content-sha256'] || hashSha256('');

  const canonicalRequest = [
    method,
    path,
    query,
    getCanonicalHeaders(headers) + '\n',
    getSignedHeaders(headers),
    bodyHash
  ].join('\n');

  const stringToSign = [ALGORITHM, datetime, credentialScope, hashSha256(canonicalRequest)].join(
    '\n'
  );

  const signingKey = getSigningKey(secretKey, date, region);
  const signature = Crypto.createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return [
    `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${getSignedHeaders(headers)}`,
    `Signature=${signature}`
  ].join(', ');
}

export default class SimpleTOSClient {
  config: SimpleTOSClientConfig;
  endpoint: string;

  constructor(config: SimpleTOSClientConfig) {
    this.config = config;
    if (/^https?:/.test(config.endpoint)) {
      let url = new URL(config.endpoint);
      this.endpoint = url.host;
    } else {
      this.endpoint = config.endpoint;
    }
  }

  append(key: string, body: any, offset: number, options?: RequestOptions): Promise<Result> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(key) || 'application/octet-stream';
    return this.requestData('POST', `${key}?append&offset=${offset}`, body, options);
  }

  get(key: string, options?: RequestOptions): Request<any> {
    return this.request('GET', key, null, options);
  }

  put(key: string, body: any, options?: RequestOptions): Promise<Result> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(key) || 'application/octet-stream';
    return this.requestData('PUT', key, body, options);
  }

  async head(key: string, options?: RequestOptions): Promise<Result> {
    let response = await this.request('HEAD', key, null, options).response();
    if (response.status === 404) {
      throw new Error('NoSuchKey');
    }
    if (response.status !== 200) {
      throw new Error(response.statusText);
    }
    return { headers: response.headers };
  }

  del(key: string, options?: RequestOptions): Promise<Result> {
    options = options || {};
    return this.requestData('DELETE', key, null, options);
  }

  deleteMultiObjects(
    objects: Array<{ key: string }>,
    options?: RequestOptions & { quiet?: boolean }
  ): Promise<Result> {
    options = options || {};
    let body = JSON.stringify({
      Quiet: options.quiet !== false,
      Objects: objects.map((o) => ({ Key: o.key }))
    });
    options.mime = 'application/json';
    return this.requestData('POST', '?delete', body, options);
  }

  async listObjectsType2(options: ListOptions): Promise<ListResult> {
    let query: Record<string, string> = {
      'list-type': '2'
    };
    if (options.prefix) query.prefix = options.prefix;
    if (options.delimiter) query.delimiter = options.delimiter;
    if (options.maxKeys) query['max-keys'] = String(options.maxKeys);
    if (options.continuationToken) query['continuation-token'] = options.continuationToken;

    let res = await this.requestData('GET', '', null, { query });

    res.KeyCount = parseInt(res.KeyCount) || 0;
    res.MaxKeys = parseInt(res.MaxKeys) || 0;
    res.IsTruncated = res.IsTruncated === 'true';
    res.Prefix = res.Prefix || '';
    if (res.Contents) {
      if (!Array.isArray(res.Contents)) res.Contents = [res.Contents];
      res.Contents.forEach((content: any) => {
        content.Size = parseInt(content.Size) || 0;
      });
    }
    if (res.CommonPrefixes) {
      if (!Array.isArray(res.CommonPrefixes)) res.CommonPrefixes = [res.CommonPrefixes];
    }

    return res;
  }

  async copyObject(
    key: string,
    srcBucket: string,
    srcKey: string,
    options?: RequestOptions
  ): Promise<Result> {
    options = options || {};
    if (!options.headers) options.headers = {};
    options.headers['x-tos-copy-source'] = `/${srcBucket}/${srcKey}`;
    return this.requestData('PUT', key, null, options);
  }

  async createMultipartUpload(
    key: string,
    options?: RequestOptions
  ): Promise<InitiateMultipartUploadResult> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(key) || 'application/octet-stream';
    let res = await this.requestData('POST', `${key}?uploads`, '', options);
    return res;
  }

  uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: any,
    options?: RequestOptions
  ): Promise<Result> {
    options = options || {};
    if (!options.mime) options.mime = mime.lookup(key) || 'application/octet-stream';
    return this.requestData(
      'PUT',
      `${key}?partNumber=${partNumber}&uploadId=${uploadId}`,
      body,
      options
    );
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; eTag: string }>,
    options?: RequestOptions
  ): Promise<CompleteMultipartUploadResult> {
    options = options || {};
    options.mime = 'application/json';
    let body = JSON.stringify({
      Parts: parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.eTag }))
    });
    let res = await this.requestData('POST', `${key}?uploadId=${uploadId}`, body, options);
    return res;
  }

  getPreSignedUrl(key: string, options?: SignatureUrlOptions): string {
    let { method = 'GET', expires = 3600, response = {} } = options || {};
    let datetime = getDateTime();
    let date = getDate(datetime);
    let host = `${this.config.bucket}.${this.endpoint}`;
    let path = `/${key}`;

    let queryParams: Record<string, string> = {
      'X-Tos-Algorithm': ALGORITHM,
      'X-Tos-Credential': `${this.config.accessKeyId}/${createScope(date, this.config.region)}`,
      'X-Tos-Date': datetime,
      'X-Tos-Expires': String(expires),
      'X-Tos-SignedHeaders': 'host'
    };

    if (this.config.stsToken) {
      queryParams['X-Tos-Security-Token'] = this.config.stsToken;
    }

    Object.keys(response).forEach((k) => {
      queryParams[`response-${k}`] = response[k];
    });

    let sortedQuery = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    let canonicalRequest = [
      method,
      path,
      sortedQuery,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD'
    ].join('\n');

    let stringToSign = [
      ALGORITHM,
      datetime,
      createScope(date, this.config.region),
      hashSha256(canonicalRequest)
    ].join('\n');

    let signingKey = getSigningKey(this.config.accessKeySecret, date, this.config.region);
    let signature = Crypto.createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');

    queryParams['X-Tos-Signature'] = signature;

    let queryString = Object.keys(queryParams)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    return `https://${host}/${key}?${queryString}`;
  }

  request(method: string, resource: string, body?: any, options?: RequestOptions): Request<any> {
    options = options || {};
    let headers: Record<string, string> = options.headers || {};
    if (options.mime) {
      headers['Content-Type'] = options.mime;
    }

    let host = `${this.config.bucket}.${this.endpoint}`;
    headers['host'] = host;
    headers['x-tos-date'] = getDateTime();
    headers['x-tos-content-sha256'] = 'UNSIGNED-PAYLOAD';

    if (this.config.stsToken) {
      headers['x-tos-security-token'] = this.config.stsToken;
    }

    let [rawPath, inlineQuery] = resource.split('?');
    let path = rawPath ? `/${rawPath}` : '/';

    let mergedQuery: Record<string, string> = {};
    if (inlineQuery) {
      inlineQuery.split('&').forEach((pair) => {
        let [k, v] = pair.split('=');
        if (k) mergedQuery[k] = v || '';
      });
    }
    if (options.query) {
      Object.assign(mergedQuery, options.query);
    }
    let queryString = this.buildQueryString(mergedQuery);

    headers['authorization'] = signRequest(
      method,
      path,
      queryString,
      headers,
      this.config.region,
      this.config.accessKeyId,
      this.config.accessKeySecret
    );

    let url = `https://${host}${path}`;
    if (queryString) url += `?${queryString}`;

    return client.request(url, {
      method,
      headers,
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

    let text = await response.text();

    if (!text && (response.status === 200 || response.status === 204)) {
      return {
        headers: response.headers
      };
    }

    if (text && text.startsWith('<')) {
      let data: any = await xml2js.parseStringPromise(text, {
        trim: true,
        explicitArray: false,
        explicitRoot: false
      });

      if (data.Code) {
        throw new Error(data.Message || data.Code);
      }

      return Object.assign({ headers: response.headers }, data);
    }

    if (text && text.startsWith('{')) {
      let data = JSON.parse(text);
      if (data.Code) {
        throw new Error(data.Message || data.Code);
      }
      return Object.assign({ headers: response.headers }, data);
    }

    return { headers: response.headers };
  }

  buildQueryString(query?: Record<string, string>): string {
    if (!query) return '';
    return Object.keys(query)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
      .join('&');
  }
}

const STS_HOST = 'open.volcengineapi.com';
const STS_SERVICE = 'sts';
const STS_REGION = 'cn-north-1';
const STS_VERSION = '2018-01-01';
const STS_ALGORITHM = 'HMAC-SHA256';
const STS_V4_IDENTIFIER = 'request';

function stsGetDateTime(): string {
  const date = new Date(new Date().toUTCString());
  return date
    .toISOString()
    .replace(/\.\d+Z/, 'Z')
    .replace(/-/g, '')
    .replace(/:/g, '');
}

function stsHmacSha256(key: string | Buffer, data: string): Buffer {
  return Crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function stsHashSha256(data: string): string {
  return Crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function stsUriEscape(str: string): string {
  return encodeURIComponent(str)
    .replace(/[^A-Za-z0-9_.~%-]+/g, escape)
    .replace(/\*/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}

export async function assumeRole(
  accessKeyId: string,
  secretKey: string,
  params: {
    RoleTrn: string;
    RoleSessionName: string;
    Policy: string;
    DurationSeconds: number;
  }
): Promise<AssumeRoleResult> {
  let datetime = stsGetDateTime();
  let date = datetime.substr(0, 8);

  let queryParams: Record<string, string> = {
    Action: 'AssumeRole',
    Version: STS_VERSION,
    RoleTrn: params.RoleTrn,
    RoleSessionName: params.RoleSessionName,
    Policy: params.Policy,
    DurationSeconds: String(params.DurationSeconds)
  };

  let sortedParamKeys = Object.keys(queryParams).sort();
  let canonicalQueryString = sortedParamKeys
    .map((k) => `${stsUriEscape(k)}=${stsUriEscape(queryParams[k])}`)
    .join('&');

  let headers: Record<string, string> = {};
  headers['host'] = STS_HOST;
  headers['x-date'] = datetime;

  let body = '';
  let payloadHash = stsHashSha256(body);

  let headerKeys = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort();
  let canonicalHeaders = headerKeys.map((k) => `${k}:${headers[k]}`).join('\n');
  let signedHeaders = headerKeys.join(';');

  let credentialScope = [date, STS_REGION, STS_SERVICE, STS_V4_IDENTIFIER].join('/');

  let canonicalRequest = [
    'GET',
    '/',
    canonicalQueryString,
    canonicalHeaders + '\n',
    signedHeaders,
    payloadHash
  ].join('\n');

  let stringToSign = [
    STS_ALGORITHM,
    datetime,
    credentialScope,
    stsHashSha256(canonicalRequest)
  ].join('\n');

  let kDate = stsHmacSha256(secretKey, date);
  let kRegion = stsHmacSha256(kDate, STS_REGION);
  let kService = stsHmacSha256(kRegion, STS_SERVICE);
  let signingKey = stsHmacSha256(kService, STS_V4_IDENTIFIER);

  let signature = Crypto.createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  let authorization = [
    `${STS_ALGORITHM} Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ');

  let url = `https://${STS_HOST}/?${canonicalQueryString}`;

  let response = await client
    .request(url, {
      method: 'GET',
      headers: {
        'x-date': datetime,
        Authorization: authorization
      },
      timeout: 15000
    })
    .response();

  let data: any = await response.json();
  if (data.ResponseMetadata?.Error) {
    throw new Error(data.ResponseMetadata.Error.Message || 'AssumeRole failed');
  }
  return data;
}
