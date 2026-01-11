# 项目知识库

**生成时间**: 2026-01-11
**项目**: fsd (File System Driver)
**架构**: Lerna Monorepo

## 概述

Node.js 通用文件存储驱动库，提供统一的抽象层支持多种存储后端（本地磁盘、阿里云 OSS、阿里云 VOD）。

核心设计：**适配器模式** + **函数式 API**。使用 `FSD({ adapter })()` 创建文件对象，而非 `new File()`。

## 结构

```
fsd/
├── packages/
│   ├── fsd/          # 核心库 (FSDFile 抽象)
│   ├── fsd-fs/       # 本地文件系统适配器
│   ├── fsd-oss/      # 阿里云 OSS 适配器
│   └── fsd-vod/      # 阿里云 VOD 适配器
├── test/             # 自定义测试用例 (22 个可复用测试模块)
├── typings/          # 第三方类型定义
└── Config files
```

## 常用位置

| 任务 | 位置 | 备注 |
|------|------|------|
| 核心文件类 | `packages/fsd/src/file.ts` | FSDFile 所有 API |
| 工厂函数 | `packages/fsd/src/fsd.ts` | FSD() 工厂 |
| FS 适配器 | `packages/fsd-fs/src/index.ts` | 本地磁盘 |
| OSS 适配器 | `packages/fsd-oss/src/index.ts` | 阿里云 OSS |
| VOD 适配器 | `packages/fsd-vod/src/index.ts` | 阿里云 VOD |
| 测试运行器 | `test/run.js` | 动态加载测试用例 |
| 类型定义 | `packages/fsd/index.d.ts` | 核心 API 类型 |

## 约定（非标准）

### 路径规范
- **文件夹路径** 必须以 `/` 结尾（如 `/uploads/`）
- **文件路径** 不以 `/` 结尾（如 `/file.txt`）
- 所有路径自动补全前导 `/`

### 导入方式
```javascript
// 从源码直接导入（测试模式）
const FSD = require('../packages/fsd/src/fsd').default;

// 生产环境从编译后的 lib 导入
const FSD = require('fsd').default;
```

### 适配器初始化
所有适配器实现 `instanceOfFSDAdapter: true` 标记：
```typescript
class Adapter {
  instanceOfFSDAdapter: true;
  name: string;
  needEnsureDir: boolean;
}
```

## 反模式（本项目禁止）

### 路径验证
```typescript
// file.ts 中严格路径检查
if (path.endsWith('/')) {
  throw new Error('append failed, file path should not ends with /');
}
if (!path.endsWith('/')) {
  throw new Error('mkdir failed, directory path should be ends with /');
}
```

### @ts-ignore 使用
```typescript
// 仅用于已知类型问题
// @ts-ignore PassThrough 有end方法
stream.end(data);
```

### 不支持的选项
```typescript
// fsd-oss 中 endpoint 已废弃
if (options.endpoint)
  throw new Error('endpoint has been deprecated, use region/[internal]/[secure]');
```

## 独特风格

### Promise 风格 API
所有操作返回 `Promise<T>`：
```typescript
await file.read();
await file.write('hello');
await file.mkdir();
```

### 自定义测试模式
测试用例导出默认函数，运行器动态加载并应用于所有适配器：
```typescript
// test/cases/write.ts
export default function (fsd) {
  test(`${fsd.adapter.name} > write`, async (t) => {
    // 测试逻辑
  });
}
```

### 文件夹操作
文件夹使用文件对象操作，强制 `/` 后缀：
```typescript
let dir = fsd('/uploads/');  // 文件夹
let file = fsd('/file.txt');  // 文件
```

## 命令

```bash
# 构建所有包
npm run build

# 运行测试（所有适配器）
npm test

# 测试覆盖率报告
npm run cover

# Lint 检查
npm run eslint

# 自动修复
npm run fix
```

## 注意事项

1. **文件夹路径必须以 `/` 结尾**：这是强制约定，违反会抛出错误
2. **所有 API 异步**：必须使用 `await`
3. **不支持文件权限**：专注于简单读写，无文件模式、组权限等 POSIX 特性
4. **测试依赖真实服务**：测试使用 `.env` 中的真实 OSS/VOD 凭证
5. **ESLint 规则严格**：100+ 中文"禁止"规则，参考 AlloyTeam 配置

## 技术栈

- **运行时**: Node.js (CommonJS)
- **语言**: TypeScript 5.9 (ES2023 target)
- **Monorepo**: Lerna 9.x + Yarn v1 workspaces
- **测试**: Tape + ts-node
- **覆盖率**: NYC (Istanbul)
- **Linter**: ESLint 9.x (flat config)
- **格式化**: Prettier (100 char width)
