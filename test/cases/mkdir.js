import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('mkdir', (troot) => {

    test('mkdir awesome', async(t) => {
      let dir = fsd('/awesome');
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir awesome');
      t.end();
    });

    test('clear', async(t) => {
      let dir = fsd('/awesome');
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
