import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > writePart', (troot) => {
    let filePath = '/awesome.txt';
    let appendStr = 'hello world';
    let uploadPath = '/uploadAwesome.txt';
    troot.test(fsd.adapter.name + ' > before writePart', async(t) => {
      let file = fsd(filePath);
      await file.write(appendStr);
      await sleep(200)
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > writePart awesome.txt string', async(t) => {
      let uploadFile = fsd(uploadPath);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(1);
      let readStream = appendStr;
      let parts = await Promise.all(tasks.map(async(task) => await uploadFile.writePart(task, readStream)));
      await sleep(200);
      await uploadFile.completeMultipartUpload(parts);
      if (await uploadFile.exists()) {
        let str = await uploadFile.read('utf8');
        t.equal(str, appendStr, 'equal writePart awesome.txt string');
      } else {
        t.error(new Error('upload file not exists'), 'writePart awesome.txt');
      }
      uploadFile.unlink().then();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > writePart awesome.txt buffer', async(t) => {
      let uploadFile = fsd(uploadPath);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(1);
      let readStream = Buffer.from(appendStr);
      let parts = await Promise.all(tasks.map(async(task) => await uploadFile.writePart(task, readStream)));
      await uploadFile.completeMultipartUpload(parts);
      if (await uploadFile.exists()) {
        let str = await uploadFile.read('utf8');
        t.equal(str, appendStr, 'equal writePart awesome.txt buffer');
      } else {
        t.error(new Error('upload file not exists'), 'writePart awesome.txt');
      }
      uploadFile.unlink().then();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > writePart awesome.txt stream', async(t) => {
      let file = fsd(filePath);
      let uploadFile = fsd(uploadPath);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(1);
      let readStream = await file.createReadStream();
      let size = Buffer.from(appendStr).length;
      let parts = await Promise.all(tasks.map(async(task) => await uploadFile.writePart(task, readStream, size)));
      await uploadFile.completeMultipartUpload(parts);
      if (await uploadFile.exists()) {
        let str = await uploadFile.read('utf8');
        t.equal(str, appendStr, 'equal writePart awesome.txt stream');
      } else {
        t.error(new Error('upload file not exists'), 'writePart awesome.txt');
      }
      uploadFile.unlink().then();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear writePart', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
