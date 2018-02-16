# fsd
General file system driver for Node.js

## 介绍
Node.js通用文件存储驱动。

通常，我们需要读写不同介质的文件系统，比如将上传的文件保存在服务器磁盘或者OSS云存储上，这些储存介质的API差异是非常大的，我们需要一个抽象的实现，方便我们的应用程序在多种存储介质之间进行切换，而不同修改任何逻辑。

**注意**，我们需要解决的储存介质的差异并非是NTFS和EXT4这个层次的差异。

我们要实现各种云服务商云存储的读写，而这些云存储服务并没有、或不需要像本地文件系统EXT4拥有的权限组控制，所以我们只专注于文件的简单读写实现，不提供诸如权限控制、文件模式之类的接口。

fsd 由两个方面的库组成，fsd主库和各种其他的存储读写适配器库，以插件的机制不断兼容各种云存储服务。

当前的适配器库有：

| 适配器库    | 说明                     |
| ------- | ---------------------- |
| fsd-fs  | 本地文件系统适配器，读写本地磁盘的文件。  [详细设置](https://github.com/maichong/fsd/tree/master/packages/fsd-fs) |
| fsd-oss | 阿里云OSS适配器，读写OSS云存储的文件。[详细设置](https://github.com/maichong/fsd/tree/master/packages/fsd-oss) |




## 安装

需要同时安装fsd主库和你所需要的适配器插件库：

```bash
npm i --save fsd fsd-oss
```



## 用法



### 配置

首先，我们需要在代码中配置fsd，以得到一个`fsd()`函数。

```js
const FSD = require('fsd');
const OSSAdapter = require('fsd-oss');

// 根据需要实例化不同的适配器
const adapter = new OSSAdapter(ossConfig);

// 生成 fsd() 函数
const fsd = FSD({ adapter: adapter });
```



### 文件对象

我们针对文件操作进行了对象风格接口封装，在你操作文件之前，首先需要获得文件对象。

```js
let file = fsd('/file.txt');

let content = await file.read('utf8');
```

使用 `fsd()` 函数创建一个文件对象，fsd没有提供类似于 `new File()`方式实例化文件对象，必须调用 `fsd()` 函数创建对象。

 使用文件对象的 `file.read()` 方法获取文件内容，如果你`read()`方法没有传入任何编码参数，我们将直接获取到文件的Buffer数据。

**注意：**文件对象所提供的所有接口都为Promise风格异步接口，请不要忘记使用 `await` 关键字。



### 读取文件Buffer

```js
let file = fsd('/file.txt');

let content = await file.read();
```



### 读取文件流

```js
let file = fsd('/file.txt');

let stream = await file.createReadStream();
```



### 创建文件和文件夹

```js
let dir = fsd('/abc/');
let file = fsd('/abc/123.txt');

await dir.mkdir();
await file.write('hello world');
```

fsd 中文件夹也使用文件对象进行操作，但是要注意，fsd强制要求文件夹路径以 `/` 结尾。

`fsd()` 函数可以获取一个不存在的文件路径，用于创建操作。



## FSDFile文件对象接口



### #path :string

文件完整路径属性。例如 `/abc/123.txt`



### #dir :string

文件所属文件夹路径属性。例如 `/abc/`



### #base :string

文件名称。例如：`123.txt`



### #name :string

不带后缀的文件名。例如 `123`



### #ext :string

文件后缀。例如`.txt`



### #read([position], [length],  [encoding])

读取文件内容。

| 参数       | 类型     | 必须   | 说明       |
| -------- | ------ | ---- | -------- |
| position | number |      | 要开始读取的位置 |
| length   | number |      | 要读取的数据长度 |
| encoding | string |      | 数据编码     |

返回值：

`Promise<Buffer|string>`

如果指定了encoding，则返回字符串，否则返回Buffer。



### #write(data)

向文件写入数据。

| 参数   | 类型                              | 必须   | 说明     |
| ---- | ------------------------------- | ---- | ------ |
| data | string \| Buffer \|  ReadStream | Yes  | 要写入的数据 |

返回值：

`Promise<void>`



### #append(data)

向文件追加数据。

| 参数   | 类型                              | 必须   | 说明     |
| ---- | ------------------------------- | ---- | ------ |
| data | string \| Buffer \|  ReadStream | Yes  | 要追加的数据 |

返回值：

`Promise<void>`



### #createReadStream([options])

创建可读数据流。

| 参数      | 类型     | 必须   | 说明    |
| ------- | ------ | ---- | ----- |
| options | Object |      | 数据流选项 |

数据流选项：

| 参数    | 类型     | 必须   | 说明      |
| ----- | ------ | ---- | ------- |
| start | number |      | 开始读取的位置 |
| end   | number |      | 结束读取的位置 |


返回值：

`Promise<ReadStream>`





### #createWriteStream([options])

创建可写数据流。

| 参数      | 类型     | 必须   | 说明    |
| ------- | ------ | ---- | ----- |
| options | Object |      | 数据流选项 |

数据流选项：

| 参数    | 类型     | 必须   | 说明                  |
| ----- | ------ | ---- | ------------------- |
| start | number |      | 开始读取的位置，OSS适配器不支持此项 |

返回值：

`Promise<WriteStream>`



### #unlink()

删除当前文件或文件夹，如果是文件夹，则会递归删除文件夹下的所有内容。

返回值：

`Promise<void>`





### #mkdir([prefix])

创建文件夹。

| 参数     | 类型      | 必须   | 说明      |
| ------ | ------- | ---- | ------- |
| prefix | boolean |      | 递归创建父目录 |

返回值：

`Promise<void>`





### #readdir([recursion])

读取文件夹（列目录），返回文件列表。

| 参数        | 类型                | 必须   | 说明     |
| --------- | ----------------- | ---- | ------ |
| recursion | boolean \| string |      | 递归列子目录 |

> 如果recursion为字符串，则视为 [minimatch](https://github.com/isaacs/minimatch) 模式匹配规则。

返回值：

`Promise<FSDFile[]>`





### #createUrl()

创建可访问URL链接，可用于文件下载等场合。

返回值：

`Promise<string>`



### #copy([dest])

拷贝文件、文件夹。


| 参数   | 类型     | 必须   | 说明   |
| ---- | ------ | ---- | ---- |
| dest | string | Yes  | 目标位置 |

返回值：

`Promise<void>`



### #rename([dest])

重命名/移动文件、文件夹。


| 参数   | 类型     | 必须   | 说明   |
| ---- | ------ | ---- | ---- |
| dest | string | Yes  | 目标位置 |

返回值：

`Promise<void>`



### #exists()

判断当前文件、文件夹是否存在。

返回值：

`Promise<boolean>`





### #isFile()

判断当前文件是否存在并是普通文件。

返回值：

`Promise<boolean>`



### #isDirectory()

判断当前文件是否存在并是一个文件夹。

返回值：

`Promise<boolean>`



### #initMultipartUpload(partCount)

初始化一个多段上传任务，返回**任务ID**数组。

| 参数        | 类型     | 必须   | 说明   |
| --------- | ------ | ---- | ---- |
| partCount | number | Yes  | 段数   |

返回值：

`Promise<string[]>`





### #writePart(partTask, data, size)

上传一个数据段。返回分段信息。

| 参数       | 类型                             | 必须   | 说明                          |
| -------- | ------------------------------ | ---- | --------------------------- |
| partTask | number                         | Yes  | 分段上传任务ID                    |
| data     | string \| Buffer \| ReadStream | Yes  | 分段数据                        |
| size     | number                         |      | 数据段长度，如果data是ReadStream，则必须 |

返回值：

`Promise<string>`

返回**分段信息**。注意，虽然分段信息也是字符串，但和分段任务ID并不相同。





### #completeMultipartUpload(parts)

完成分段上传。

| 参数    | 类型       | 必须   | 说明     |
| ----- | -------- | ---- | ------ |
| parts | string[] | Yes  | 分段信息数组 |


返回值：

`Promise<void>`





