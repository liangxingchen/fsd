import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('write', (troot) => {
    let filePath = `/awesome.txt`;
    let testPath = '/testAwesome.txt';
    let appendStr = 'hello world';
    test('before write', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append(appendStr);
      }
      t.end();
    });

    test('write awesome.txt string', async(t) => {
      let file = fsd(filePath);
      await file.write(appendStr);
      let readStr = await file.read('utf8');
      t.equal(readStr, appendStr, 'write string');
      t.end();
    });

    test('write awesome.txt buffer', async(t) => {
      let file = fsd(filePath);
      await file.write(Buffer.from(appendStr));
      let readStr = await file.read('utf8');
      t.equal(readStr, appendStr, 'write buffer');
      t.end();
    });

    test('write awesome.txt stream', async(t) => {
      let file = fsd(filePath);
      let testFile = fsd(testPath);
      await testFile.unlink();
      let stream = await file.createReadStream();
      await testFile.write(stream);
      let readStr = await testFile.read('utf8');
      t.equal(readStr, appendStr, 'write stream');
      await testFile.unlink();
      t.end();
    });

    test('clear write', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
