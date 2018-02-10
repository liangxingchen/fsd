import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('mkdir', (troot) => {
    let path = '/awesome/';
    let deepPath = '/awesome/awesome/awesome/awesome/';

    test('mkdir awesome', async(t) => {
      let dir = fsd(path);
      if(!(await dir.exists())){
        await dir.mkdir();
      }
      t.ok(await dir.exists(), 'mkdir awesome');
      t.end();
    });

    test('mkdir awesome prefix', async(t) => {
      let dir = fsd(deepPath);
      await dir.mkdir(true);
      t.ok(await dir.exists(), 'mkdir awesome prefix');
      t.end();
    });

    test('clear', async(t) => {
      let dir = fsd(path);
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
