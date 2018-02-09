import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('mkdir', (troot) => {
    let path = '/awesome';
    let deepPath = '/awesome/a/b/c';

    test('mkdir awesome', async(t) => {
      let dir = fsd(path);
      if (!(await dir.exists())) {
        await dir.unlink();
        await dir.mkdir();
      }
      t.ok(await dir.exists(), 'mkdir awesome');
      t.end();
    });

    test('mkdir awesome prefix', async(t) => {
      let dir = fsd(deepPath);
      let prefixDir = fsd(path);
      await prefixDir.unlink();
      await dir.mkdir(true);
      t.ok(await dir.exists(), 'mkdir awesome prefix');
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
