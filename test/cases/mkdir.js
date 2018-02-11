import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils'

export default function (fsd: fsdFn) {
  test('mkdir', (troot) => {
    let path = '/abc/';
    let deepPath = '/bbc/mk/mk/';

    test('mkdir awesome', async(t) => {
      let dir = fsd(path);
      if(await dir.exists()){
        await dir.unlink();
      }
      await sleep(100);
      await dir.mkdir(true);
      t.ok(await dir.exists(), 'mkdir awesome');
      t.end();
    });

    test('mkdir awesome prefix', async(t) => {
      let dir = fsd(deepPath);
      if(await dir.exists()){
        await dir.unlink();
      }
      await sleep(100);
      await dir.mkdir(true);
      t.ok(await dir.exists(), 'mkdir awesome prefix');
      t.end();
    });

    test('clear', async(t) => {
      let dir = fsd(path);
      if (await dir.exists()) {
        await dir.unlink();
      }
      let deepDir = fsd(deepPath);
      if (await deepDir.exists()) {
        await deepDir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
