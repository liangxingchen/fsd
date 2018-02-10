import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {
  test('isDirectory', (troot) => {
    let dirPath = '/abc/';
    let filePath = '/abc/a.js';

    test('before isDirectory', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.mkdir();
      await file.write();
      await sleep(100);
      t.ok(await dir.exists(), 'mk dir error');
      t.ok(await file.exists(), 'mk file error');
      t.end();
    });

    test('isDirectory true', async(t) => {
      let dir = fsd(dirPath);
      try {
        let isDirectory = await dir.isDirectory();
        t.ok(isDirectory, 'isDirectory true ok');
      } catch (err) {
        t.error(err, err.message);
      }
      t.end();
    });

    test('isDirectory false', async(t) => {
      let dir = fsd(filePath);
      try {
        let isDirectory = await dir.isDirectory();
        t.ok(isDirectory, 'isDirectory false ok');
      } catch (err) {
        t.error(err, err.message);
      }
      t.end();
    });

    test('clear isDirectory', async(t) => {
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
