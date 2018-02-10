import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('writePart', (troot) => {
    let filePath = '/awesome.txt';
    let appendStr = 'hello world';
    let uploadPath = '/uploadAwesome.txt';
    test('before writePart', async(t) => {
      let file = fsd(filePath);
      await file.write(appendStr);
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    test('writePart awesome.txt string', async(t) => {
      let file = fsd(filePath);
      let uploadFile = fsd(uploadPath);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(1);
      let readStream = appendStr;
      let parts = await Promise.all(tasks.map(async(task) => await uploadFile.writePart(task, readStream)));
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

    test('writePart awesome.txt buffer', async(t) => {
      let file = fsd(filePath);
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

    test('writePart awesome.txt stream', async(t) => {
      let file = fsd(filePath);
      let uploadFile = fsd(uploadPath);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(1);
      let readStream = await file.createReadStream();
      let parts = await Promise.all(tasks.map(async(task) => await uploadFile.writePart(task, readStream)));
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

    test('clear writePart', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
