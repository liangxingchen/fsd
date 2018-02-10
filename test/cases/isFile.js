import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {
  test('isFile', (troot) => {
    let dirPath = '/abc/';
    let filePath = '/abc/a.js';

    test('before isFile', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.mkdir();
      await file.write();
      await sleep(100);
      t.ok(await dir.exists(), 'mkdir error');
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    test('isFile true', async(t) => {
      let file = fsd(filePath);
      try {
        let isFile = await file.isFile();
        t.ok(isFile, 'isFile true ok');
      } catch (err) {
        t.error(err, err.message);
      }
      t.end();
    });

    test('isFile false', async(t) => {
      let dir = fsd(dirPath);
      try {
        let isFile = await dir.isFile();
        t.ok(isFile, 'isFile false ok');
      } catch (err) {
        t.error(err, err.message);
      }
      t.end();
    });

    test('clear isFile', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
