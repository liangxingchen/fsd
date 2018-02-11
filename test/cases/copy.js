import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function (fsd: fsdFn) {
  test('copy', (troot) => {
    let dirPath = '/fsd/';
    let filePath = '/fsd/a.txt';
    let copyPath = '/fsd/b.txt';
    let appendStr = 'hello world';

    test('before copy', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      if (!await dir.exists()) {
        await dir.mkdir();
      }
      await file.write(appendStr);
      await sleep(200);
      t.ok(await dir.exists(), 'before copy');
      t.ok(await file.exists(), 'before copy');
      t.end();
    });

    test('copy copy.js', async(t) => {
      let file = fsd(filePath);
      await file.copy(copyPath);
      await sleep(200);
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
