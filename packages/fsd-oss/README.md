# fsd-oss

FSD 阿里云 OSS 文件存储适配器 - 提供对阿里云 OSS 对象存储的读写访问。

[![npm version](https://badge.fury.io/js/fsd-oss.svg)](https://www.npmjs.com/package/fsd-oss)

## 概述

`fsd-oss` 是 `fsd` 核心库的阿里云 OSS 适配器，提供完整的对象存储操作能力。

### 核心特性

- ✅ 完整的文件 CRUD 操作
- ✅ 分段上传（大文件优化）
- ✅ STS 角色扮演（边缘上传）
- ✅ 上传回调通知
- ✅ 自定义 OSS 客户端
- ✅ 缩略图支持

## 安装

```bash
npm install fsd-oss
```

## 配置

```typescript
import FSD from 'fsd';
import OSSAdapter from 'fsd-oss';

// 创建适配器
const adapter = new OSSAdapter({
  accessKeyId: 'your-access-key-id',        // 必需：OSS 访问凭证
  accessKeySecret: 'your-access-key-secret', // 必需：OSS 访问凭证
  region: 'oss-cn-hangzhou',                // 必需：OSS 区域
  bucket: 'your-bucket-name'                // 可选：Bucket 名称
});

// 创建 FSD 实例
const fsd = FSD({ adapter });
```

### 配置选项说明

| 选项 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `accessKeyId` | string | 是 | - | OSS 访问凭证 |
| `accessKeySecret` | string | 是 | - | OSS 访问凭证 |
| `region` | string | 是 | - | OSS 区域（如 oss-cn-hangzhou） |
| `bucket` | string | 否 | - | Bucket 名称（也可在 path 中指定） |
| `root` | string | 否 | '/' | 存储根路径 |
| `urlPrefix` | string | 否 | - | URL 前缀，用于生成访问链接 |
| `publicRead` | boolean | 否 | false | 是否公共读，控制生成的 URL 是否需要签名 |
| `internal` | boolean | 否 | false | 是否使用内网访问，与应用在同一区域时更快且免费 |
| `secure` | boolean | 否 | true | 是否使用 HTTPS |
| `timeout` | number | 否 | - | 请求超时时间（毫秒） |
| `accountId` | string | 否 | - | STS 角色扮演：阿里云账号 ID |
| `roleName` | string | 否 | - | STS 角色扮演：角色名称 |
| `callbackUrl` | string | 否 | - | 上传回调 URL，上传完成后 OSS 会调用此接口 |
| `thumbs` | object | 否 | - | 缩略图配置，key 为缩略图名称，value 为 OSS 处理参数 |


## License

MIT
