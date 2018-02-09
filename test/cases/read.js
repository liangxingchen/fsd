import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('read', (troot) => {
    let filePath = `/awesome.txt`;
    let str = 'hello world';
    test('before read', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append(str);
      }
      t.end();
    });

    test('read awesome.txt encoding', async(t) => {
      let file = fsd(filePath);
      let res = await file.read('utf8');
      t.equal(res, str, 'read encoding');
      t.end();
    });

    test('read awesome.txt position length', async(t) => {
      let file = fsd(filePath);
      let res = await file.read(2, 1);
      let eq = str.substr(2, 1);
      t.equal(res.toString(), eq, 'read position length');
      t.ok(res, 'read position length');
      t.end();
    });

    test('read awesome.txt position length encoding', async(t) => {
      let file = fsd(filePath);
      let res = await file.read(0, 4, 'utf8');
      let eq = str.substr(0, 4);
      t.equal(res.toString(), eq, 'read position length encoding');
      t.end();
    });

    test('clear read', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });
    troot.end();
  });
}
