import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('read', (troot) => {
    let filePath = `/awesome.txt`;
    test('before read', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append('hello world');
      }
      t.end();
    });

    test('read awesome.txt encoding', async(t) => {
      let file = fsd(filePath);
      try {
        let res = await file.read('utf8');
        t.ok(res, 'read encoding');
      } catch (err) {
        t.notOk(err, 'read encoding');
      }
      t.end();
    });

    test('read awesome.txt position length', async(t) => {
      let file = fsd(filePath);
      try {
        let res = await file.read(0, 10);
        t.ok(res, 'read position length');
      } catch (err) {
        t.notOk(err, 'read position length');
      }
      t.end();
    });
    test('read awesome.txt position length encoding', async(t) => {
      let file = fsd(filePath);
      try {
        let res = await file.read(0, 10, 'utf8');
        t.ok(res, 'read position length encoding');
      } catch (err) {
        t.notOk(err, 'read position length encoding');
      }
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
