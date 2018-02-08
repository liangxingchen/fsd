import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('copy', (troot) => {
    let dirPath = '/abc';
    let filePath = 'a.js';
    let copyPath = '/abc/a.js';

    test('before copy', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.mkdir();
      await file.write('test');
      t.ok(await dir.exists(), 'mkdir error');
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    test('copy copy.js', async(t) => {
      let file = fsd(filePath);
      await file.copy(copyPath);
      let copyDir = fsd(copyPath);
      t.ok(await copyDir.exists(), 'copy ok');
      t.end();
    });

    test('clear copy', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      let copyFile = fsd(copyPath);
      if (await copyFile.exists()) {
        await copyFile.unlink();
      }
      if (await file.exists()) {
        await file.unlink();
      }
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
