import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {

  test('append', (troot) => {
    let filePath = `/awesome.txt`;
    let testPath = '/testAwesome.txt';
    let appendStr = 'hello world';

    test('append string', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      await sleep(200);
      await file.append(appendStr);
      await sleep(200);
      let str = await file.read('utf8');
      t.equal(str, appendStr, 'append string');
      t.end();
    });

    test('append buffer', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      await sleep(200);
      let buf = Buffer.from(appendStr);
      await file.append(buf);
      let str = await file.read('utf8');
      t.equal(str, appendStr, 'append buffer');
      t.end();
    });

    test('append stream', async(t) => {
      let file = fsd(filePath);
      let testFile = fsd(testPath);
      await testFile.unlink();
      let stream = await file.createReadStream();
      await testFile.append(stream);
      let readStr = await testFile.read('utf8');
      t.equal(readStr, appendStr, 'append stream');
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
