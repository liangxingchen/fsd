# fsd

通用文件系统驱动库 - 为 Node.js 提供统一的文件存储抽象层。

[![npm version](https://badge.fury.io/js/fsd.svg)](https://www.npmjs.com/package/fsd)

## 概述

FSD (File System Driver) 是一个适配器模式的文件存储抽象层，提供统一的 API 接口，支持多种存储后端（本地磁盘、阿里云 OSS、阿里云 VOD）。

### 核心特性

- **统一 API** - 一套 API，多种存储后端
- **适配器模式** - 轻松扩展新存储后端
- **Promise 风格** - 所有操作返回 Promise
- **流式支持** - 支持大文件的流式读写
- **类型安全** - 完整的 TypeScript 类型定义

### 架构

```
┌─────────────────────────────────────┐
│         Your Application            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         FSD Core                    │
│    (统一 API 抽象层)                  │
└──────┬──────────┬──────────┬────────┘
       │          │          │
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  FS      │ │   OSS    │ │   VOD    │
│  Adapter │ │  Adapter │ │  Adapter │
│(本地磁盘) │ │ (阿里云)  │ │ (阿里云)  │
└──────────┘ └──────────┘ └──────────┘
```

## 安装

```bash
npm install fsd
```

还需要安装对应的适配器包：

```bash
# 本地文件系统
npm install fsd-fs

# 阿里云 OSS
npm install fsd-oss

# 阿里云 VOD
npm install fsd-vod
```

## 快速开始

### 基础用法

```typescript
import FSD from 'fsd';
import FSAdapter from 'fsd-fs';

// 创建 FSD 实例
const fsd = FSD({
  adapter: new FSAdapter({ root: '/uploads' })
});

// 创建文件对象
const file = fsd('/test.txt');

// 写入文件
await file.write('Hello, FSD!');

// 读取文件
const content = await file.read('utf8');
console.log(content); // 'Hello, FSD!'
```

### 目录操作

```typescript
// 创建目录（注意：目录路径必须以 / 结尾）
const dir = fsd('/photos/');
await dir.mkdir(true); // 递归创建

// 列出目录内容
const files = await dir.readdir();
for (const f of files) {
  console.log(f.name); // 文件名
  console.log(f.path); // 完整路径
}
```

## 路径约定（重要）

FSD 对文件和目录路径有严格的约定，违反会抛出错误：

### 文件路径

- **必须** 不以 `/` 结尾
- 自动补全前导 `/`

```typescript
// ✅ 正确
const file = fsd('/test.txt');      // 正确
const file = fsd('test.txt');       // 自动补全为 '/test.txt'

// ❌ 错误
const file = fsd('/test.txt/');     // Error: file path should not ends with /
```

### 目录路径

- **必须** 以 `/` 结尾
- 自动补全前导 `/`

```typescript
// ✅ 正确
const dir = fsd('/uploads/');       // 正确
const dir = fsd('uploads');         // 错误：必须以 / 结尾

// ❌ 错误
const dir = fsd('/uploads');        // Error: directory path should be ends with /
```

## 使用不同适配器

### 本地文件系统 (fsd-fs)

```typescript
import FSD from 'fsd';
import FSAdapter from 'fsd-fs';

const fsd = FSD({
  adapter: new FSAdapter({
    root: '/app/uploads',      // 必需：存储根目录
    mode: 0o644,               // 可选：文件权限，默认 0o644
    tmpdir: '/tmp/fsd-tmp',    // 可选：临时目录（分段上传时使用）
    urlPrefix: 'https://cdn.example.com' // 可选：URL 前缀
  })
});

const file = fsd('/test.txt');
await file.write('Local file content');
```

### 阿里云 OSS (fsd-oss)

```typescript
import FSD from 'fsd';
import OSSAdapter from 'fsd-oss';

const fsd = FSD({
  adapter: new OSSAdapter({
    accessKeyId: 'your-access-key-id',        // 必需
    accessKeySecret: 'your-access-key-secret', // 必需
    region: 'oss-cn-hangzhou',               // 必需：区域
    bucket: 'your-bucket-name',              // 可选：Bucket 名称
    root: '/uploads',                         // 可选：存储根路径
    urlPrefix: 'https://cdn.example.com',      // 可选：URL 前缀
    publicRead: true,                         // 可选：公共读
    internal: false,                          // 可选：内网访问
    secure: true                              // 可选：HTTPS
  })
});

const file = fsd('/uploads/test.txt');
await file.write('OSS file content');
```

**⚠️ 注意**: `endpoint` 选项已废弃，请使用 `region/[internal]/[secure]`。

### 阿里云 VOD (fsd-vod)

```typescript
import FSD from 'fsd';
import VODAdapter from 'fsd-vod';

const fsd = FSD({
  adapter: new VODAdapter({
    accessKeyId: 'your-access-key-id',        // 必需
    accessKeySecret: 'your-access-key-secret', // 必需
    region: 'cn-shanghai',                    // 可选：默认 cn-shanghai
    privateKey: 'your-rsa-private-key',      // 必需：视频上传签名私钥
    templateGroupId: 'your-template-group-id', // 可选：转码模板组
    workflowId: 'your-workflow-id',          // 可选：工作流 ID
    urlPrefix: 'https://cdn.example.com'      // 可选：URL 前缀
  })
});

// VOD 必须先分配视频 ID
const videoId = await fsd.adapter.alloc({ name: 'video.mp4' });
const file = fsd(videoId);

await file.write(videoBuffer);
```

## API 参考

### FSDFile 对象属性

```typescript
const file = fsd('/path/to/document.pdf');

console.log(file.path);    // '/path/to/document.pdf' - 完整路径
console.log(file.dir);     // '/path/to/' - 目录路径
console.log(file.base);    // 'document.pdf' - 文件名（含扩展名）
console.log(file.name);    // 'document' - 文件名（不含扩展名）
console.log(file.ext);     // '.pdf' - 扩展名
console.log(file.needEnsureDir); // false/true - 是否需要确保目录存在
```

### 文件操作

#### write(data) - 写入文件

```typescript
// 写入字符串
await file.write('Hello, World!');

// 写入 Buffer
await file.write(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]));

// 写入流
const readStream = fs.createReadStream('/local/file.txt');
await file.write(readStream);

// 创建空文件
await file.write();
```

#### read([encoding] | [position, length] | [position, length, encoding]) - 读取文件

```typescript
// 读取为 UTF-8 字符串
const text = await file.read('utf8');

// 读取为 Buffer
const buffer = await file.read();

// 读取指定范围（前 100 字节）
const partial = await file.read(0, 100);

// 读取指定范围并解码
const text = await file.read(100, 50, 'utf8');
```

#### append(data) - 追加内容

```typescript
// 追加字符串
await file.append('\nNew line');

// 追加 Buffer
await file.append(Buffer.from('additional data'));

// 追加流
const sourceStream = fs.createReadStream('/append.txt');
await file.append(sourceStream);
```

### 流式操作

#### createReadStream([options]) - 创建可读流

```typescript
// 创建完整文件流
const readStream = await file.createReadStream();
readStream.pipe(process.stdout);

// 指定范围读取（从第 100 字节到 199 字节）
const partialStream = await file.createReadStream({
  start: 100,
  end: 199
});

// 流式下载到本地
const fs = require('fs');
const readStream = await file.createReadStream();
const writeStream = fs.createWriteStream('/local/download.txt');
readStream.pipe(writeStream);
await new Promise(resolve => writeStream.on('finish', resolve));
```

#### createWriteStream([options]) - 创建可写流

```typescript
// 创建可写流
const writeStream = await file.createWriteStream();
writeStream.write('Hello');
writeStream.end();

// 等待流完成（如果适配器支持 promise 属性）
if (writeStream.promise) {
  await writeStream.promise;
}

// 从本地文件流式上传
const fs = require('fs');
const readStream = fs.createReadStream('/local/file.txt');
const writeStream = await file.createWriteStream();
readStream.pipe(writeStream);
if (writeStream.promise) {
  await writeStream.promise;
}
```

### 目录操作

#### mkdir([recursive]) - 创建目录

```typescript
// 创建单级目录（父目录必须存在）
await dir.mkdir();

// 递归创建多级目录
await dir.mkdir(true); // 等价于 mkdir -p
```

#### readdir([recursion]) - 读取目录

```typescript
// 列出直接子项
const files = await dir.readdir();
for (const f of files) {
  console.log(f.name);
  if (await f.isFile()) {
    console.log(`File: ${f.path}`);
  } else if (await f.isDirectory()) {
    console.log(`Directory: ${f.path}`);
  }
}

// 递归列出所有文件
const allFiles = await dir.readdir(true);
console.log(`Total: ${allFiles.length} files`);

// 使用 glob 模式筛选
const images = await dir.readdir('**/*.jpg');
for (const img of images) {
  console.log(img.path);
}
```

### 文件信息

#### exists() - 判断文件/目录是否存在

```typescript
if (await file.exists()) {
  console.log('File exists');
} else {
  await file.write('Create this file');
}
```

#### isFile() / isDirectory() - 判断类型

```typescript
if (await file.isFile()) {
  console.log('This is a file');
  console.log(`Size: ${await file.size()} bytes`);
}

if (await dir.isDirectory()) {
  console.log('This is a directory');
}
```

#### size() - 获取文件大小

```typescript
const size = await file.size();
console.log(`File size: ${size} bytes`);

// 格式化显示
const sizeMB = size / (1024 * 1024);
console.log(`File size: ${sizeMB.toFixed(2)} MB`);
```

#### lastModified() - 获取最后修改时间

```typescript
const modified = await file.lastModified();
console.log('Last modified:', modified.toISOString());

// 判断文件是否过期（例如 1 天前）
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
if (modified < oneDayAgo) {
  console.log('File is older than 1 day');
}
```

### 文件管理

#### copy(dest) - 复制文件

```typescript
// 复制到同级目录
const copy = await file.copy('file_copy.txt');

// 复制到子目录
const copy = await file.copy('backup/file.txt');

// 复制到绝对路径
const copy = await file.copy('/other/path/file.txt');

// 复制目录（递归）
const dirCopy = await dir.copy('backup/');
```

#### rename(dest) - 重命名/移动

```typescript
// 重命名文件
await file.rename('new_name.txt');

// 移动文件到子目录
await file.rename('backup/file.txt');

// 移动文件到绝对路径
await file.rename('/other/path/file.txt');

// 重命名目录
await dir.rename('new_folder/');
```

#### unlink() - 删除文件/目录

```typescript
// 删除文件
await file.unlink();

// 删除目录及其所有内容
await dir.unlink();
```

### URL 生成

#### createUrl([options]) - 创建访问 URL

```typescript
// 创建默认链接（1 小时后过期）
const url = await file.createUrl();
console.log('Download URL:', url);

// 创建 10 分钟后过期的链接
const url = await file.createUrl({ expires: 600 });

// 创建带下载提示的链接
const url = await file.createUrl({
  expires: 3600,
  response: {
    'content-type': 'application/pdf',
    'content-disposition': 'attachment; filename="document.pdf"'
  }
});

// VOD 适配器：获取不同清晰度的视频播放地址
const hdUrl = await file.createUrl({ path: '/video/HD' });
const sdUrl = await file.createUrl({ path: '/video/SD' });
```

### 分片上传（大文件）

#### initMultipartUpload(partCount) - 初始化分片上传

```typescript
// 初始化 3 个分片
const tasks = await file.initMultipartUpload(3);
console.log(tasks);
// ['task://uploadId123?1', 'task://uploadId123?2', 'task://uploadId123?3']
```

#### writePart(partTask, data, [size]) - 上传分片

```typescript
const tasks = await file.initMultipartUpload(3);
const parts = [];

// 上传第一个分片（Buffer）
const part1 = await file.writePart(tasks[0], Buffer.from('part1 data'));
parts.push(part1);

// 上传第二个分片（流）
const stream = fs.createReadStream('/tmp/part2');
const part2 = await file.writePart(tasks[1], stream, 1024);
parts.push(part2);

// 上传第三个分片（字符串）
const part3 = await file.writePart(tasks[2], 'part3 data');
parts.push(part3);
```

#### completeMultipartUpload(parts) - 完成分片上传

```typescript
const tasks = await file.initMultipartUpload(3);
const parts = [];

for (let i = 0; i < tasks.length; i++) {
  const part = await file.writePart(tasks[i], getDataForPart(i));
  parts.push(part);
}

// 完成上传（注意：parts 顺序可以与 tasks 顺序不同）
await file.completeMultipartUpload(parts);
```

### 完整示例：文件上传服务

```typescript
import FSD from 'fsd';
import FSAdapter from 'fsd-fs';
import express from 'express';

const app = express();
const fsd = FSD({
  adapter: new FSAdapter({ root: '/uploads' })
});

// 单文件上传
app.post('/upload', async (req, res) => {
  const file = req.files.file;
  const destFile = fsd(`/uploads/${file.name}`);

  // 使用流式上传
  await destFile.write(file.data);

  // 生成下载链接（24 小时后过期）
  const downloadUrl = await destFile.createUrl({ expires: 86400 });

  res.json({
    path: destFile.path,
    size: await destFile.size(),
    downloadUrl
  });
});

// 分片上传大文件
app.post('/upload/multipart', async (req, res) => {
  const { fileName, partCount } = req.body;
  const file = fsd(`/uploads/${fileName}`);

  // 初始化分片上传
  const tasks = await file.initMultipartUpload(partCount);
  res.json({ tasks });
});

app.post('/upload/part', async (req, res) => {
  const { task } = req.body;
  const file = fsd('/uploads/target.txt');

  // 上传分片
  const part = await file.writePart(task, req.body.data, req.body.size);
  res.json({ part });
});

app.post('/upload/complete', async (req, res) => {
  const { fileName, parts } = req.body;
  const file = fsd(`/uploads/${fileName}`);

  // 完成上传
  await file.completeMultipartUpload(parts);

  res.json({ success: true });
});

// 文件列表
app.get('/files/:path', async (req, res) => {
  const dir = fsd(`/${req.params.path}/`);
  const files = await dir.readdir(true); // 递归列出

  const fileList = await Promise.all(files.map(async f => ({
    name: f.name,
    path: f.path,
    size: await f.size(),
    isFile: await f.isFile()
  })));

  res.json(fileList);
});

app.listen(3000);
```

### 使用 OSS 实现云存储

```typescript
import FSD from 'fsd';
import OSSAdapter from 'fsd-oss';

const fsd = FSD({
  adapter: new OSSAdapter({
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    region: 'oss-cn-hangzhou',
    bucket: 'my-bucket',
    root: '/uploads'
  })
});

// 上传文件并获取访问 URL
async function uploadFile(filename, data) {
  const file = fsd(`/uploads/${filename}`);
  await file.write(data);

  const url = await file.createUrl({ expires: 3600 });
  return { path: file.path, url };
}

// 批量上传
async function uploadMultiple(files) {
  const results = await Promise.all(
    files.map(f => uploadFile(f.name, f.data))
  );
  return results;
}
```

### 自定义适配器

你可以创建自己的存储适配器：

```typescript
import { Adapter } from 'fsd';

class MyCustomAdapter extends Adapter<MyOptions> {
  readonly instanceOfFSDAdapter = true;
  readonly name = 'MyCustomAdapter';
  readonly needEnsureDir = false;

  constructor(options: MyOptions) {
    super(options);
    // 初始化你的存储系统
  }

  async write(path: string, data: any): Promise<void> {
    // 实现写入逻辑
  }

  async read(path: string, options?: any): Promise<any> {
    // 实现读取逻辑
  }

  // ... 实现其他必需方法
}

// 使用自定义适配器
const fsd = FSD({
  adapter: new MyCustomAdapter({ /* options */ })
});
```

## TypeScript 支持

完整的 TypeScript 类型定义已包含在包中：

```typescript
import FSD, { FSDFile, Adapter, ReadStreamOptions } from 'fsd';

const fsd: ReturnType<typeof FSD> = FSD({
  adapter: myAdapter
});

const file: FSDFile = fsd('/test.txt');
```

## 常见问题

### Q: 如何切换存储后端？

A: 只需更换适配器，应用代码无需修改：

```typescript
// 开发环境使用本地文件系统
const devFsd = FSD({
  adapter: new FSAdapter({ root: '/uploads' })
});

// 生产环境使用 OSS
const prodFsd = FSD({
  adapter: new OSSAdapter({
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET
  })
});

// 使用方式完全相同
await devFsd('/test.txt').write('Hello');
await prodFsd('/test.txt').write('Hello');
```

### Q: 如何处理大文件？

A: 使用流式操作或分片上传：

```typescript
// 流式上传（适合中等大小文件）
const stream = await file.createWriteStream();
sourceStream.pipe(stream);
await stream.promise;

// 分片上传（适合大文件）
const tasks = await file.initMultipartUpload(5);
// ... 上传分片
await file.completeMultipartUpload(parts);
```

### Q: 如何检查适配器类型？

A: 使用 `adapter.name` 属性：

```typescript
console.log(fsd.adapter.name); // 'FSAdapter', 'OSSAdapter', 'VODAdapter'

if (fsd.adapter.name === 'OSSAdapter') {
  console.log('Using OSS storage');
}
```

### Q: 目录操作失败怎么办？

A: 确保目录路径以 `/` 结尾，或使用递归创建：

```typescript
// ❌ 错误
await fsd('/uploads').mkdir(); // Error

// ✅ 正确
await fsd('/uploads/').mkdir(); // Success

// ✅ 或递归创建
await fsd('/uploads/subdir/').mkdir(true); // Success
```

## 相关包

- [fsd-fs](https://www.npmjs.com/package/fsd-fs) - 本地文件系统适配器
- [fsd-oss](https://www.npmjs.com/package/fsd-oss) - 阿里云 OSS 适配器
- [fsd-vod](https://www.npmjs.com/package/fsd-vod) - 阿里云 VOD 适配器

## License

MIT
