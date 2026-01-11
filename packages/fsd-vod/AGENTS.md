# FSD-VOD 阿里云 VOD 适配器

**生成时间**: 2026-01-11
**包名**: fsd-vod
**适配器**: VODAdapter

## 概述

阿里云 VOD（视频点播）适配器，专用于视频上传和管理，依赖 fsd-oss 处理文件上传。

## 结构

```
packages/fsd-vod/
├── src/index.ts      # VODAdapter 实现 (417 行)
├── lib/             # 编译后的 JS
├── index.d.ts       # 导出类型
├── package.json
└── README.md
```

## 常用位置

| 任务 | 位置 |
|------|------|
| VOD 适配器 | `src/index.ts` |
| 类型定义 | `index.d.ts` |

## 约定

### 初始化选项
```typescript
{
  accessKeyId, accessKeySecret,  // 必需
  region = 'cn-shanghai',
  privateKey,                    // 视频上传签名私钥
  templateGroupId, workflowId, urlPrefix, callbackUrl
}
```

### 文件路径格式
使用视频 ID 作为路径：`/{videoId}`

### Token 缓存
使用 LRUCache 缓存上传令牌，避免重复请求。

## 反模式

### 不支持目录操作
```typescript
await file.mkdir();    // Error
await file.readdir();  // Error
await file.copy();     // Error
await file.rename();   // Error
```

### 不要忘记 alloc()
```typescript
// ❌ 错误
let file = fsd('/video.mp4');

// ✅ 正确
let videoId = await adapter.alloc({ name: 'video.mp4' });
let file = fsd(videoId);
```

### 必需 privateKey
没有配置 `privateKey` 会导致视频上传失败。

## 独特风格

内部使用 SimpleOSSClient（来自 fsd-oss）处理文件上传，支持 UploadToken 自动刷新令牌，使用 `debug('fsd-vod')` 输出日志，`needEnsureDir: false` 不需要预先创建目录。
