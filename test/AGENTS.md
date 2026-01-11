# FSD 测试套件

**生成时间**: 2026-01-11
**测试框架**: Tape
**覆盖率**: NYC (Istanbul)

## 概述

自定义测试运行器，动态加载测试用例并应用于所有适配器（FS、OSS、VOD）。

## 结构

```
test/
├── cases/              # 可复用测试用例 (22 个)
│   ├── read.ts
│   ├── write.ts
│   ├── append.ts
│   ├── mkdir.ts
│   ├── readdir.ts
│   ├── exists.ts
│   ├── isFile.ts
│   ├── isDirectory.ts
│   ├── copy.ts
│   ├── rename.ts
│   ├── unlink.ts
│   ├── size.ts
│   ├── lastModified.ts
│   ├── createReadStream.ts
│   ├── createWriteStream.ts
│   ├── createUrl.ts
│   ├── toString.ts
│   ├── toJSON.ts
│   ├── initMultipartUpload.ts
│   ├── writePart.ts
│   └── createUploadToken.ts
├── vod/                # VOD 专用测试
│   └── upload.ts
├── run.js              # 自定义测试运行器
├── ts.js               # ts-node 入口
└── test.mp4            # 测试视频文件
```

## 常用位置

| 任务 | 位置 | 备注 |
|------|------|------|
| 测试运行器 | `run.js` | 动态加载和运行测试 |
| 测试用例 | `cases/*.ts` | 可复用测试模块 |
| VOD 测试 | `vod/upload.ts` | 视频上传测试 |

## 约定

### 测试用例格式
```typescript
// test/cases/write.ts
export default function (fsd) {
  test(`${fsd.adapter.name} > write`, (troot) => {
    troot.test(`${fsd.adapter.name} > before write`, async (t) => {
      // 准备
    });
    troot.test(`${fsd.adapter.name} > write file`, async (t) => {
      // 实际测试
      const file = fsd('/test.txt');
      await file.write('hello');
      t.ok(true, 'write success');
    });
    troot.test(`${fsd.adapter.name} > clear write`, async (t) => {
      // 清理
      await file.unlink();
    });
    troot.end();
  });
}
```

### 环境变量
测试依赖 `.env` 中的真实服务凭证：
```
FILE_OSS_KEYID=***
FILE_OSS_SECRET=***
FILE_OSS_BUCKET=***
FILE_OSS_REGION=***
FILE_OSS_ACCOUNT=***
FILE_OSS_ROLE=***
VOD_KEYID=***
VOD_SECRET=***
VOD_PRIVATE_KEY=***
VOD_TEMPLATE_GROUP_ID=***
VOD_URL_PREFIX=***
```

## 独特风格

### 动态加载
使用 `globSync` 发现测试文件并动态 `require()`：
```javascript
const files = globSync('cases/*', { cwd: __dirname });
for (let file of files) {
  let cases = require(Path.join(__dirname, file)).default;
  cases(FSD({ adapter }));  // 应用到每个适配器
}
```

### 多适配器验证
每个测试用例在 3 个适配器上运行：
- FSAdapter - 本地文件系统
- OSSAdapter - 阿里云 OSS
- VODAdapter - 阿里云 VOD

### 手动清理
每个测试套件包含 clear 步骤：
```typescript
troot.test(`${fsd.adapter.name} > clear <method>`, async (t) => {
  await file.unlink();
  t.end();
});
```

### 延迟同步
使用 `delay()` 包处理异步等待：
```typescript
await delay(200);   // 等待文件写入
await delay(5000);  // 等待视频上传完成
```

### 错误处理
全局未处理 Promise 拒绝处理：
```javascript
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p);
  process.exit(1);
});
```

## 测试分类

### 基础操作 (10 个)
- read, write, append, exists, size, lastModified
- mkdir, readdir, isFile, isDirectory

### 文件操作 (4 个)
- copy, rename, unlink
- createReadStream, createWriteStream

### URL 转换 (3 个)
- createUrl, toString, toJSON

### 高级操作 (3 个)
- initMultipartUpload, writePart
- createUploadToken (VOD 专用)

### VOD 专用 (1 个)
- upload
