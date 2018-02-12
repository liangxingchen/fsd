import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > isDirectory', (troot) => {
    let dirPath = '/abc/';
    let filePath = '/abc/a.js';

    troot.test(fsd.adapter.name + ' > before isDirectory', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      await dir.mkdir(true);
      await file.write();
      await sleep(100);
      t.ok(await dir.exists(), 'mk dir error');
      t.ok(await file.exists(), 'mk file error');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > isDirectory true', async(t) => {
      let dir = fsd(dirPath);
      t.ok(await dir.isDirectory(), 'isDirectory true ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > isDirectory false', async(t) => {
      let file = fsd(filePath);
      try {
        await file.isDirectory();
        t.fail('isDirectory throw error when target is a file');
      } catch (err) {
        t.pass('isDirectory throw error when target is a file');
      }
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear isDirectory', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
