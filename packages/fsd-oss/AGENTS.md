# FSD-OSS 阿里云 OSS 适配器

**生成时间**: 2026-01-11
**包名**: fsd-oss
**适配器**: OSSAdapter

## 概述

阿里云 OSS 文件存储适配器，支持完整 CRUD 操作、多段上传、STS 角色扮演。

## 结构

```
packages/fsd-oss/
├── src/
│   ├── index.ts                 # OSSAdapter 主实现 (491 行)
│   └── simple-oss-client.ts     # 自定义 OSS 客户端 (301 行)
├── lib/                        # 编译后的 JS
├── simple-oss-client.js         # JS 包装文件
├── simple-oss-client.d.ts       # 类型定义
├── index.d.ts                  # 导出类型
├── package.json
└── README.md
```

## 常用位置

| 任务 | 位置 | 备注 |
|------|------|------|
| OSS 适配器 | `src/index.ts` | OSSAdapter 类 |
| OSS 客户端 | `src/simple-oss-client.ts` | SimpleOSSClient |

## 约定

### 初始化选项
```typescript
{
  accessKeyId: string;      // 必需
  accessKeySecret: string;  // 必需
  region: string;          // 必需
  bucket?: string;
  root?: string;          // 默认 '/'
  urlPrefix?: string;
  publicRead?: boolean;
  internal?: boolean;
  secure?: boolean;
  timeout?: number;
  accountId?: string;      // STS 角色扮演
  roleName?: string;       // STS 角色扮演
  callbackUrl?: string;    // 边缘上传回调
}
```

### 已废弃选项
```typescript
// ❌ 错误 - endpoint 已废弃
new OSSAdapter({ endpoint: '...' });

// ✅ 正确 - 使用 region
new OSSAdapter({ region: 'oss-cn-hangzhou' });
```

## 反模式

### 不要使用 endpoint
```typescript
// 错误
throw new Error('endpoint has been deprecated, use region/[internal]/[secure] instead!');
```

### 不支持 start 选项
```typescript
// readStream 不支持 start 选项
await file.createReadStream({ start: 100 }); // Error
```

### 无需确保目录
`needEnsureDir: false`，不需要预先创建目录。

## 独特风格

### 自定义 OSS 客户端
`SimpleOSSClient` 封装阿里云 OSS API：
- `putObject()` - 上传文件
- `getObject()` - 下载文件
- `appendObject()` - 追加文件
- `initiateMultipartUpload()` - 初始化分片上传
- `uploadPart()` - 上传分片
- `completeMultipartUpload()` - 完成分片上传

### STS 角色扮演
支持阿里云 STS 临时凭证（用于边缘上传）：
```typescript
if (options.accountId && options.roleName) {
  // 生成 STS token
  this._rpc = new RPC({ stsEndpoint });
}
```

### Callback 回调
支持上传后回调：
```typescript
const CALLBACK_BODY =
  'bucket=${bucket}&path=${object}&etag=${etag}&size=${size}...';
```

### 不支持的操作
- `mkdir()` - OSS 无目录概念
- `readdir()` - 通过 listObjects 实现
- `copy()` - 通过 copyObject 实现
- `rename()` - 通过 copy + delete 实现
