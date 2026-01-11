# fsd-vod

阿里云 VOD（视频点播）适配器，专用于视频上传和管理。

## 配置

```javascript
const FSD = require('fsd');
const VodAdapter = require('fsd-vod');

const adapter = new VodAdapter({
  accessKeyId: 'your-key',
  accessKeySecret: 'your-secret',
  region: 'cn-shanghai',
  privateKey: 'your-private-key',  // 必需
  urlPrefix: 'https://your-domain.com'
});

const fsd = FSD({ adapter: adapter });
```

### 配置选项说明

| 选项 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `accessKeyId` | string | 是 | - | 阿里云访问凭证 |
| `accessKeySecret` | string | 是 | - | 阿里云访问凭证 |
| `region` | string | 否 | 'cn-shanghai' | 区域代码 |
| `privateKey` | string | 是 | - | 视频上传签名私钥（必需） |
| `templateGroupId` | string | 否 | - | 模板组 ID |
| `workflowId` | string | 否 | - | 工作流 ID |
| `urlPrefix` | string | 否 | - | URL 前缀，用于生成访问链接 |
| `callbackUrl` | string | 否 | - | 回调 URL |

### 重要说明

#### 1. 视频路径使用规则

VOD 适配器**不支持直接指定文件路径**，必须先通过 `adapter.alloc()` 分配视频 ID，然后使用该 ID 作为路径。

**为什么需要视频 ID？**

阿里云 VOD 不像传统的文件系统那样有目录结构，每个视频上传前需要在 VOD 服务端预先分配一个唯一的视频 ID。这个 ID 会用于后续的上传、转码、播放等操作。

**正确的使用方式：**

```javascript
// ✅ 正确：先分配视频 ID
const videoId = await fsd.adapter.alloc({
  name: 'my-video.mp4',
  metadata: {
    title: 'My Video',
    description: 'Video description'
  }
});

// 使用返回的视频 ID 创建文件对象
const file = fsd(videoId);
// videoId 格式类似: 'ea5e82e7e8c54d3c8a5d8c5d8c5d8c5d'

// 上传视频
await file.write(videoBuffer);
```

**错误的使用方式：**

```javascript
// ❌ 错误：不能直接指定路径
const file = fsd('/videos/my-video.mp4');
await file.write(videoBuffer); // Error: 无法直接写入

// ❌ 错误：路径必须是由 alloc() 返回的视频 ID
const file = fsd('my-video.mp4');
await file.write(videoBuffer); // Error: 视频不存在
```

**alloc() 方法说明：**

```javascript
// alloc() 返回视频 ID
const videoId = await fsd.adapter.alloc(options);

// options 参数：
{
  name: string,              // 必需：视频文件名（如 'video.mp4'）
  metadata?: {               // 可选：视频元数据
    title?: string,          // 视频标题
    description?: string,    // 视频描述
    tags?: string[],         // 视频标签
    category?: string,       // 视频分类
    // ... 其他自定义元数据
  }
}
```

**文件对象属性：**

```javascript
const videoId = await fsd.adapter.alloc({ name: 'video.mp4' });
const file = fsd(videoId);

console.log(file.path);    // 视频 ID: 'ea5e82e7e8c54d3c8a5d8c5d8c5d8c5d'
console.log(file.dir);     // '/'
console.log(file.base);    // 视频 ID
console.log(file.name);    // 视频 ID（无扩展名）
console.log(file.ext);     // ''
```

---

#### 2. 不支持的目录操作

由于阿里云 VOD 是对象存储服务，没有传统的目录概念，因此以下目录操作方法**不支持**：

- `mkdir()` - 创建目录
- `readdir()` - 列出目录
- `copy()` - 复制文件/目录
- `rename()` - 重命名/移动文件/目录

**不支持的操作及原因：**

| 方法 | 不支持原因 |
|------|-----------|
| `mkdir()` | VOD 没有目录概念，无需创建目录 |
| `readdir()` | 无法遍历 VOD 服务中的视频列表，需调用阿里云 VOD API |
| `copy()` | VOD 不支持在服务端复制视频 |
| `rename()` | VOD 不支持在服务端重命名视频 |

**调用这些方法会发生什么？**

```javascript
// ❌ 创建目录
const dir = fsd('/videos/');
await dir.mkdir(); // Error: mkdir not supported

// ❌ 列出目录
const files = await dir.readdir(); // Error: readdir not supported

// ❌ 复制视频
const file = fsd(videoId);
await file.copy(videoId2); // Error: copy not supported

// ❌ 重命名视频
await file.rename(newVideoId); // Error: rename not supported
```

**如何列出 VOD 中的视频？**

需要直接调用阿里云 VOD API 来查询视频列表：

```javascript
// 使用阿里云 VOD SDK 查询视频列表
const vod = require('@alicloud/vod20170321');
const client = new vod.default({
  accessKeyId: 'your-key',
  accessKeySecret: 'your-secret',
  region: 'cn-shanghai'
});

// 查询视频列表
const result = await client.searchMedia({
  searchType: 'video',
  pageNo: 1,
  pageSize: 50
});

console.log(result.mediaList); // 视频列表
```

