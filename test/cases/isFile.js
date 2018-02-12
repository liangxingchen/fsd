import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../sleep';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > isFile', (troot) => {
    let dirPath = '/abc/';
    let filePath = '/abc/a.js';

    troot.test(fsd.adapter.name + ' > before isFile', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.mkdir();
      await file.write();
      await sleep(100);
      t.ok(await dir.exists(), 'mkdir error');
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > isFile true', async(t) => {
      let file = fsd(filePath);
      try {
        let isFile = await file.isFile();
        t.ok(isFile, 'isFile true ok');
      } catch (err) {
        t.error(err, err.message);
      }
      t.end();
    });

    troot.test(fsd.adapter.name + ' > isFile false', async(t) => {
      let dir = fsd(dirPath);
      try {
        await dir.isFile();
        t.fail('isFile fail, when path ends with /');
      } catch (err) {
        t.pass('isFile throw error, when path ends with /');
      }
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear isFile', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.unlink();
      await file.unlink();
      t.end();
    });

    troot.end();
  });
}
