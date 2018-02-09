import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('toString', (troot) => {
    let dirPath = '/abc';

    test('before toString', async(t) => {
      let dir = fsd(dirPath);
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    test('toString', async(t) => {
      let dir = fsd(dirPath);
      let data = await dir.toString();
      t.equal(data, dirPath, 'toString OK');
      t.end();
    });

    test('clear toString', async(t) => {
      let dir = fsd(dirPath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
