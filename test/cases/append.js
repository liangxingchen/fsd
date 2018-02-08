import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {

  test('append', (troot) => {
    let filePath = `/awesome.txt`;
    let testPath = '/testAwesome.txt';
    let appendStr = 'hello world';

    test('append awesome.txt string', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      await file.append(appendStr);
      let str = await file.read('utf8');
      t.equal(str, appendStr, 'append hello world');
      t.end();
    });

    test('append awesome.txt buffer', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      let buf = Buffer.from(appendStr);
      await file.append(buf);
      let str = await file.read('utf8');
      t.equal(str, appendStr, 'append hello buffer');
      t.end();
    });

    test('append awesome.txt stream', async(t) => {
      let file = fsd(filePath);
      let testFile = fsd(testPath);
      await testFile.unlink();
      let stream = await file.createReadStream();
      await testFile.append(stream);
      let readStr = await testFile.read('utf8');
      t.equal(readStr, appendStr, 'append hello stream');
      await testFile.unlink();
      t.end();
    });

    test('clear append', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
