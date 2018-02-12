import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../sleep';

export default function (fsd: fsdFn) {

  test(fsd.adapter.name + ' > append', (troot) => {
    let filePath = `/awesome.txt`;
    let testPath = '/testAwesome.txt';
    let appendStr = 'hello world';

    troot.test(fsd.adapter.name + ' > append string', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      await sleep(200);
      await file.append(appendStr);
      await sleep(200);
      let str = await file.read('utf8');
      t.equal(str, appendStr, 'append string');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > append buffer', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      await sleep(200);
      let buf = Buffer.from(appendStr);
      await file.append(buf);
      let str = await file.read('utf8');
      t.equal(str, appendStr, 'append buffer');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > append stream', async(t) => {
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

    troot.test(fsd.adapter.name + ' > clear append', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
