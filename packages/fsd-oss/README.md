# fsd-oss

FSD OSS文件读写适配器。

```js
const FSD = require('fsd');
const OSSAdapter = require('fsd-oss');

const adapter = new OSSAdapter(config);
const fsd = FSD({ adapter: adapter });

let file = fsd('/test.txt');

let content = await fsd.read();

```

FSD 文档： https://github.com/maichong/fsd

适配器初始化选项：

| 选项              | 类型               | 必须   | 说明                           |
| --------------- | ---------------- | ---- | ---------------------------- |
| root            | string           |      | 以OSS子目录作为存储根路径，例如 '/uploads' |
| urlPrefix       | string           |      | URL前缀，用于生成下载链接               |
| publicRead      | boolean          |      | bucket是否允许公共读               |
| accessKeyId     | string           | Yes  | OSS访问KEY                     |
| accessKeySecret | string           | Yes  | OSS访问秘钥                      |
| bucket          | string           |      |                              |
| region          | string           |      |                              |
| internal        | boolean          |      |                              |
| secure          | boolean          |      |                              |
| timeout         | string \| number |      |                              |
| accountId | string | | 阿里云账号，用于边缘上传生成STS角色扮演令牌 |
| roleName | string | | 阿里云角色名，用于边缘上传生成STS角色扮演令牌 |
| callbackUrl | string | | 边缘上传后的回调地址 |

OSS 相关参数设置参考 https://github.com/ali-sdk/ali-oss#ossoptions

