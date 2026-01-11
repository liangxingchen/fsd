# fsd

General file system driver for Node.js

## 介绍

FSD (File System Driver) 是一个为 Node.js 提供统一文件存储抽象层的通用驱动库。它通过适配器模式，让开发者可以用同一套 API 接口无缝切换不同的存储后端（本地磁盘、阿里云 OSS、阿里云 VOD 等），而无需修改应用代码。

### 核心特性

- **统一 API** - 一套接口，多种存储后端
- **适配器模式** - 插件化设计，轻松扩展新的存储服务
- **Promise 风格** - 所有操作返回 Promise，支持 async/await
- **流式支持** - 支持大文件的流式读写和分段上传
- **类型安全** - 完整的 TypeScript 类型定义

### 设计理念

传统的文件系统 API 差异巨大，无论是本地文件系统、云存储还是对象存储，都有不同的接口和约定。FSD 通过抽象层将这些差异屏蔽，让开发者专注于业务逻辑，而不是存储实现的细节。

**注意**：FSD 关注的是不同存储介质（如本地磁盘 vs 云存储）的抽象，而不是文件系统类型（如 NTFS vs EXT4）的差异。由于云存储服务通常不需要像传统文件系统那样的权限组控制，FSD 专注于简单的文件读写操作，不提供文件模式、权限组等复杂的 POSIX 特性。

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

## 支持的适配器

FSD 采用插件化架构，由核心库和各种适配器库组成。当前的适配器包括：

| 适配器库 | 说明 | 详细配置 |
|---------|------|----------|
| [fsd-fs](./packages/fsd-fs) | 本地文件系统适配器，读写服务器磁盘文件 | [配置说明](./packages/fsd-fs) |
| [fsd-oss](./packages/fsd-oss) | 阿里云 OSS 适配器，读写 OSS 云存储文件 | [配置说明](./packages/fsd-oss) |
| [fsd-vod](./packages/fsd-vod) | 阿里云 VOD 适配器，专用于视频上传和管理 | [配置说明](./packages/fsd-vod) |

## 安装

FSD 由核心库和适配器插件组成，需要根据需求安装相应的包：

```bash
# 安装核心库
npm install fsd

# 根据需求安装对应的适配器
npm install fsd-fs      # 本地文件系统
npm install fsd-oss      # 阿里云 OSS
npm install fsd-vod      # 阿里云 VOD
```

## 文档

### 详细使用文档

完整的 API 文档、使用示例和接口说明，请查看 [packages/fsd/README.md](./packages/fsd/README.md)

文档包含：
- 快速开始指南
- 完整的 API 参考
- 路径约定说明
- 流式操作
- 分片上传
- 目录操作
- 文件管理
- TypeScript 支持
- 常见问题

### 适配器配置文档

每个适配器的详细配置说明：

- **fsd-fs** (本地文件系统) - [README](./packages/fsd-fs)
- **fsd-oss** (阿里云 OSS) - [README](./packages/fsd-oss)
- **fsd-vod** (阿里云 VOD) - [README](./packages/fsd-vod)

## 快速开始

### 基础概念

1. **配置适配器** - 根据需求选择并配置存储适配器
2. **创建 FSD 实例** - 使用工厂函数 `FSD({ adapter })` 创建实例
3. **操作文件** - 通过 `fsd(path)` 创建文件对象，调用相应方法

### 示例

```javascript
import FSD from 'fsd';
import FSAdapter from 'fsd-fs';

// 1. 配置适配器
const adapter = new FSAdapter({ root: '/uploads' });

// 2. 创建 FSD 实例
const fsd = FSD({ adapter });

// 3. 创建文件对象并操作
const file = fsd('/test.txt');
await file.write('Hello, FSD!');
const content = await file.read('utf8');
console.log(content); // 'Hello, FSD!'
```

**注意**：完整的使用示例和 API 文档请查看 [packages/fsd/README.md](./packages/fsd/README.md)

## 路径约定

FSD 对文件和目录路径有严格的约定，违反会抛出错误：

- **文件路径**：必须**不以** `/` 结尾
- **目录路径**：必须**以** `/` 结尾

```javascript
// ✅ 正确
const file = fsd('/test.txt');      // 文件
const dir = fsd('/uploads/');       // 目录

// ❌ 错误
const file = fsd('/test.txt/');     // Error: file path should not ends with /
const dir = fsd('/uploads');        // Error: directory path should be ends with /
```

## 链接

- [npm 包](https://www.npmjs.com/package/fsd)
- [GitHub 仓库](https://github.com/liangxingchen/fsd)
- [核心文档](./packages/fsd/README.md)
- [fsd-fs 文档](./packages/fsd-fs)
- [fsd-oss 文档](./packages/fsd-oss)
- [fsd-vod 文档](./packages/fsd-vod)

## License

MIT
