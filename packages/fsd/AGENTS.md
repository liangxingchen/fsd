# FSD 核心库

**生成时间**: 2026-01-11
**包名**: fsd
**版本**: 0.14.1

## 概述

FSD 核心库，提供文件对象抽象层和工厂函数。

## 结构

```
packages/fsd/
├── src/
│   ├── fsd.ts       # FSD() 工厂函数
│   └── file.ts      # FSDFile 类实现 (322 行)
├── lib/             # 编译后的 JS
├── index.d.ts       # TypeScript 类型定义 (296 行)
├── package.json
└── README.md
```

## 常用位置

| 任务 | 位置 | 备注 |
|------|------|------|
| 工厂函数 | `src/fsd.ts` | 创建 FSD 实例 |
| 文件类 | `src/file.ts` | 所有文件操作方法 |
| 类型定义 | `index.d.ts` | 核心 API 类型 |

## 约定

### 工厂模式
必须通过 `FSD({ adapter })()` 创建文件对象：
```typescript
import FSD from 'fsd';
import OSSAdapter from 'fsd-oss';

const adapter = new OSSAdapter(config);
const fsd = FSD({ adapter });
```

### 路径验证
- 文件操作路径**不能**以 `/` 结尾
- 目录操作路径**必须**以 `/` 结尾
- 所有路径自动补全前导 `/`

### 文件对象属性
```typescript
file.path    // 完整路径 '/a/b/c.txt'
file.dir     // 目录 '/a/b/'
file.base    // 文件名 'c.txt'
file.name    // 不带扩展名 'c'
file.ext     // 扩展名 '.txt'
```

## 反模式

### 不要使用 new FSDFile
```typescript
// 错误
const file = new FSDFile('/path', adapter);

// 正确
const fsd = FSD({ adapter });
const file = fsd('/path');
```

### 路径错误
```typescript
// 错误 - 文件路径不能以 / 结尾
await fsd('/file/').read(); // Error

// 错误 - 目录路径必须以 / 结尾
await fsd('/dir').mkdir(); // Error
```

## 独特风格

### 缓存机制
`_size` 和 `_lastModified` 缓存在文件对象中，避免重复查询：
```typescript
this._size = typeof metadata.size === 'number' ? metadata.size : null;
this._lastModified = metadata.lastModified || null;
```

### Stream 包装
`read()` 方法通过 `createReadStream()` 实现，使用 Buffer 拼接：
```typescript
let stream = await this._adapter.createReadStream(this.path, options);
return await new Promise((resolve, reject) => {
  let buffers: Buffer[] = [];
  stream.on('data', (data) => buffers.push(data));
  stream.on('end', () => resolve(Buffer.concat(buffers)));
});
```

### 任务 ID 格式
分段上传任务 ID 格式：`task:{number}`
```typescript
if (!task.startsWith('task:')) throw new Error('Invalid task link');
```
