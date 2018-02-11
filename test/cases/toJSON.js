import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('toJSON', (troot) => {
    let dirPath = '/abc/';

    test('before toJSON', async(t) => {
      let dir = fsd(dirPath);
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    test('toJSON', async(t) => {
      let dir = fsd(dirPath);
      let data = await dir.toJSON();
      t.equal(data, dirPath, 'toJSON OK');
      t.end();
    });

    test('clear toJSON', async(t) => {
      let dir = fsd(dirPath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
