import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('readdir', (troot) => {
    let dirPath = '/abc';
    let aFilePath = '/abc/a.js';
    let bFilePath = '/abc/b.js';

    test('before readdir', async(t) => {
      let dir = fsd(dirPath);
      let aFile = fsd(aFilePath);
      let bFile = fsd(bFilePath);
      await dir.mkdir();
      await aFile.write();
      await bFile.write();
      t.ok(await dir.exists(), 'mkdir error');
      t.ok(await aFile.exists(), 'write error');
      t.ok(await bFile.exists(), 'write error');
      t.end();
    });

    test('readdir abc', async(t) => {
      let dir = fsd(dirPath);
      let files = await dir.readdir(true);
      t.equal(files.length, 2, 'readdir OK');
      t.end();
    });

    test('clear readdir', async(t) => {
      let dir = fsd(dirPath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });
    troot.end();
  });
}
