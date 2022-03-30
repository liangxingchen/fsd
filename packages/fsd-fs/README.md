# fsd-fs
FSD 本地磁盘文件读写适配器。

```js
const FSD = require('fsd');
const FSAdapter = require('fsd-fs');

const adapter = new FSAdapter(config);

const fsd = FSD({ adapter: adapter });

let file = fsd('/test.txt');

let content = await fsd.read();

```

FSD 文档： https://github.com/liangxingchen/fsd

适配器初始化选项：

| 选项        | 类型     | 必须   | 说明                            |
| --------- | ------ | ---- | ----------------------------- |
| root      | string | Yes  | 本地存储根路径，例如 '/app/uploads'     |
| mode      | number |      | 创建的文件权限，默认 `0o666`            |
| tmpdir    | string |      | 临时目录，用于分段上传时暂存文件，如不使用分段上传，可省略 |
| urlPrefix | string |      | URL前缀，用于生成下载链接                |


