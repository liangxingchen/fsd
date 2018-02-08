import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('mkdir', (troot) => {

    test('mkdir abc', async(t) => {
      let dir = fsd('/abc');
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    // .....

    test('clear', async(t) => {
      let dir = fsd('/abc');
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
