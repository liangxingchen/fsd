import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('isFile', (troot) => {
    let dirPath = '/abc';
    let filePath = '/abc/a.js';

    test('before isFile', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.mkdir();
      await file.write();
      t.ok(await dir.exists(), 'mkdir error');
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    test('isFile true', async(t) => {
      let dir = fsd(filePath);
      let isFile = await dir.isFile();
      t.ok(isFile, 'isFile true ok');
      t.end();
    });

    test('isFile false', async(t) => {
      let dir = fsd(dirPath);
      let isFile = await dir.isFile();
      t.notOk(isFile, 'isFile false ok');
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
