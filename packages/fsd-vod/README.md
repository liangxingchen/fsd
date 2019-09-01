# fsd-vod

FSD VOD文件读写适配器。

```js
const FSD = require('fsd');
const VodAdapter = require('fsd-vod');

const adapter = new VodAdapter(config);
const fsd = FSD({ adapter: adapter });

let videoId = await adapter.alloc({ name: 'test.mp4' });
let file = fsd(videoId);

await fsd.write(data);

```

FSD 文档： https://github.com/maichong/fsd

适配器初始化选项：

| 选项              | 类型               | 必须   | 说明                           |
| --------------- | ---------------- | ---- | ---------------------------- |
| urlPrefix       | string           |      | URL前缀，用于生成下载链接         |
| accessKeyId     | string           | Yes  | Vod访问KEY                    |
| accessKeySecret | string           | Yes  | Vod访问秘钥                    |
| region          | string           |      | 默认 cn-shanghai              |
| templateGroupId | string           |      | 转码模板组ID                   |
| workflowId      | string           |      | 工作流ID                      |

