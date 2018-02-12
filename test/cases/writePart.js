import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import _ from 'lodash';
import sleep from '../sleep';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > writePart', (troot) => {
    const DATA_STRING = 'hello world';
    const FILE_PATH = '/awesome.txt';
    const UPLOAD_FILE_PATH = '/uploadAwesome.txt';
    const TASK_COUNT = 3;

    troot.test(fsd.adapter.name + ' > before writePart', async(t) => {
      let file = fsd(FILE_PATH);
      await file.write(DATA_STRING);
      await sleep(200);
      t.ok(await file.exists(), 'write error');
      let upload = fsd(UPLOAD_FILE_PATH);
      if (await upload.exists()) {
        await upload.unlink();
      }
      t.end();
    });

    troot.test(fsd.adapter.name + ' > writePart awesome.txt string', async(t) => {
      let uploadFile = fsd(UPLOAD_FILE_PATH);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(TASK_COUNT);
      t.ok(_.isArray(tasks), 'upload tasks is array');
      t.equal(tasks.length, TASK_COUNT, 'upload tasks count');
      let parts = await Promise.all(tasks.map(async(task) => {
        return await uploadFile.writePart(task, DATA_STRING);
      }));
      t.ok(_.isArray(parts), 'upload parts is array');
      t.equal(parts.length, TASK_COUNT, 'upload parts count');
      await sleep(200);
      await uploadFile.completeMultipartUpload(parts);
      await sleep(200);
      if (await uploadFile.exists()) {
        let str = await uploadFile.read('utf8');
        t.equal(str, _.repeat(DATA_STRING, TASK_COUNT), 'File content error after completeMultipartUpload');
      } else {
        t.fail('File not exists after completeMultipartUpload');
      }
      await uploadFile.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > writePart awesome.txt buffer', async(t) => {
      let uploadFile = fsd(UPLOAD_FILE_PATH);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(TASK_COUNT);
      t.ok(_.isArray(tasks), 'upload tasks is array');
      t.equal(tasks.length, TASK_COUNT, 'upload tasks count');
      let parts = await Promise.all(tasks.map(async(task) => {
        return await uploadFile.writePart(task, Buffer.from(DATA_STRING));
      }));
      t.ok(_.isArray(parts), 'upload parts is array');
      t.equal(parts.length, TASK_COUNT, 'upload parts count');
      await sleep(200);
      await uploadFile.completeMultipartUpload(parts);
      await sleep(200);
      if (await uploadFile.exists()) {
        let str = await uploadFile.read('utf8');
        t.equal(str, _.repeat(DATA_STRING, TASK_COUNT), 'File content error after completeMultipartUpload');
      } else {
        t.fail('File not exists after completeMultipartUpload');
      }
      await uploadFile.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > writePart awesome.txt stream', async(t) => {
      let file = fsd(FILE_PATH);
      let uploadFile = fsd(UPLOAD_FILE_PATH);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      let tasks = await uploadFile.initMultipartUpload(TASK_COUNT);
      t.ok(_.isArray(tasks), 'upload tasks is array');
      t.equal(tasks.length, TASK_COUNT, 'upload tasks count');
      let parts = await Promise.all(tasks.map(async(task) => {
        return await uploadFile.writePart(task, await file.createReadStream());
      }));
      t.ok(_.isArray(parts), 'upload parts is array');
      t.equal(parts.length, TASK_COUNT, 'upload parts count');
      await sleep(200);
      await uploadFile.completeMultipartUpload(parts);
      await sleep(200);
      if (await uploadFile.exists()) {
        let str = await uploadFile.read('utf8');
        t.equal(str, _.repeat(DATA_STRING, TASK_COUNT), 'File content error after completeMultipartUpload');
      } else {
        t.fail('File not exists after completeMultipartUpload');
      }
      await uploadFile.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear writePart', async(t) => {
      let file = fsd(FILE_PATH);
      if (await file.exists()) {
        await file.unlink();
      }
      let uploadFile = fsd(UPLOAD_FILE_PATH);
      if (await uploadFile.exists()) {
        await uploadFile.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
