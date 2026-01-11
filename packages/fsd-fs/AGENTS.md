# FSD-FS 本地文件系统适配器

**生成时间**: 2026-01-11
**包名**: fsd-fs
**适配器**: FSAdapter

## 概述

本地文件系统适配器，读写服务器磁盘文件，支持完整的文件和目录操作。

## 结构

```
packages/fsd-fs/
├── src/index.ts      # FSAdapter 实现 (245 行)
├── lib/             # 编译后的 JS
├── index.d.ts       # 导出类型
├── package.json
└── README.md
```

## 常用位置

| 任务 | 位置 |
|------|------|
| FS 适配器 | `src/index.ts` |
| 类型定义 | `index.d.ts` |

## 约定

### 初始化选项
```typescript
{
  root: string,          // 必需，本地存储根路径
  mode = 0o666,          // 创建文件权限
  tmpdir?: string,       // 临时目录（分段上传时使用）
  urlPrefix?: string     // URL 前缀，用于生成下载链接
}
```

### 目录操作
使用 `mapLimit` 限制并发操作，`glob` 进行模式匹配递归列出。

### 调试命名空间
使用 `debug('fsd-fs')` 输出日志。

## 反模式

### 必需 root 选项
```typescript
// ❌ 错误 - 缺少 root
new FSAdapter(); // Error

// ✅ 正确
new FSAdapter({ root: '/app/uploads' });
```

### 不要忘记 tmpdir
如果使用分段上传，必须配置 `tmpdir` 临时目录。

### 路径超出 root
所有操作限制在 `root` 目录下，无法访问上级目录。

## 独特风格

### PassThrough 流包装
使用 `PassThrough` 流处理流式读写，确保接口一致性。

### 并发控制
`mapLimit` 限制并发数，避免文件系统过载。

### 支持 ensureDir
`needEnsureDir: true`，自动确保目录存在。
