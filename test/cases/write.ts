import * as test from 'tape';
import type { FileGenerator } from '../../packages/fsd';
import delay from 'delay';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > write`, (troot) => {
    let filePath = `/awesome.txt`;
    let testPath = '/testAwesome.txt';
    let appendStr = 'hello world';
    troot.test(`${fsd.adapter.name} > before write`, async (t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append(appendStr);
      }
      t.end();
    });

    troot.test(`${fsd.adapter.name} > write awesome.txt string`, async (t) => {
      let file = fsd(filePath);
      await file.write(appendStr);
      let readStr = await file.read('utf8');
      t.equal(readStr, appendStr, 'write string');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > write awesome.txt buffer`, async (t) => {
      let file = fsd(filePath);
      await file.write(Buffer.from(appendStr));
      let readStr = await file.read('utf8');
      t.equal(readStr, appendStr, 'write buffer');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > write awesome.txt stream`, async (t) => {
      let file = fsd(filePath);
      let testFile = fsd(testPath);
      await testFile.unlink();
      let stream = await file.createReadStream();
      await testFile.write(stream);
      await delay(200);
      let readStr = await testFile.read('utf8');
      t.equal(readStr, appendStr, 'write stream');
      await testFile.unlink();
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear write`, async (t) => {
      let file = fsd(filePath);
      await file.unlink();
      t.end();
    });

    troot.end();
  });
}
