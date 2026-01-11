# fsd-fs

FSD 本地文件系统适配器 - 提供对服务器磁盘文件的读写访问。

[![npm version](https://badge.fury.io/js/fsd-fs.svg)](https://www.npmjs.com/package/fsd-fs)

## 概述

`fsd-fs` 是 `fsd` 核心库的本地文件系统适配器，提供完整的文件和目录操作能力。

### 核心特性

- ✅ 完整的文件读写操作
- ✅ 目录管理（创建、删除、遍历）
- ✅ 流式读写（大文件处理）
- ✅ 分段上传（大文件优化）
- ✅ 递归目录列表
- ✅ Glob 模式匹配
- ✅ 文件权限控制
- ✅ 并发控制优化

## 安装

```bash
npm install fsd-fs
```

## 配置

```typescript
import FSD from 'fsd';
import FSAdapter from 'fsd-fs';

// 创建适配器
const adapter = new FSAdapter({
  root: '/app/uploads',        // 必需：本地存储根路径
  mode: 0o644,                  // 可选：创建文件权限（默认 0o644）
  tmpdir: '/tmp/fsd-multipart', // 可选：临时目录（分段上传时使用，默认系统临时目录）
  urlPrefix: 'https://cdn.example.com' // 可选：URL 前缀（生成访问链接时使用）
});

// 创建 FSD 实例
const fsd = FSD({ adapter });
```

### 配置选项说明

| 选项 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `root` | string | 是 | - | 本地存储根路径，所有文件操作限制在此目录下 |
| `mode` | number | 否 | 0o644 | 创建文件时的权限模式（八进制） |
| `tmpdir` | string | 否 | os.tmpdir() | 分段上传时的临时文件存储目录 |
| `urlPrefix` | string | 否 | - | URL 前缀，用于生成访问链接，通常配合 CDN 或反向代理使用 |

### 文件权限模式

文件权限使用八进制表示法：

| 模式 | 说明 |
|------|------|
| 0o644 | rw-r--r-- (用户读写，组和其他只读) - 最常用 |
| 0o755 | rwxr-xr-x (用户读写执行，组和其他读执行) - 目录常用 |
| 0o600 | rw------- (仅用户可读写) - 敏感文件 |
| 0o666 | rw-rw-rw- (用户、组、其他都可读写) - 默认值 |

权限位说明：
- `4` = read (读)
- `2` = write (写)
- `1` = execute (执行)
- `0` = 无权限

示例 `0o644`:
- 用户: 4+2+0 = 6 (rw)
- 组: 4+0+0 = 4 (r--)
- 其他: 4+0+0 = 4 (r--)

## License

MIT
