import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('exists', (troot) => {
    let dirPath = '/abc';

    test('exists true', async(t) => {
      let dir = fsd(dirPath);
      await dir.mkdir();
      let isExists = await dir.exists();
      t.ok(isExists, 'exists true OK');
      if (isExists) {
        await dir.unlink();
      } else {
        t.notOk(isExists, 'exists true error');
      }
      t.end();
    });

    test('exists false', async(t) => {
      let dir = fsd(dirPath);

      let isExists = await dir.exists();
      if (isExists) {
        await dir.unlink();
      }
      t.notOk(isExists, 'exists false Ok');
      t.end();
    });

    troot.end();
  });
}
