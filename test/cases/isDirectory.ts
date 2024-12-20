import * as test from 'tape';
import type { FileGenerator } from '../../packages/fsd';
import delay from 'delay';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > isDirectory`, (troot) => {
    let dirPath = '/abc/';
    let filePath = '/abc/a.js';

    troot.test(`${fsd.adapter.name} > before isDirectory`, async (t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.unlink();
      await dir.mkdir(true);
      await file.write();
      await delay(100);
      t.ok(await dir.exists(), 'mk dir error');
      t.ok(await file.exists(), 'mk file error');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > isDirectory true`, async (t) => {
      let dir = fsd(dirPath);
      t.ok(await dir.isDirectory(), 'isDirectory true ok');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > isDirectory false`, async (t) => {
      let file = fsd(filePath);
      try {
        await file.isDirectory();
        t.fail('isDirectory throw error when target is a file');
      } catch (_e) {
        t.pass('isDirectory throw error when target is a file');
      }
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear isDirectory`, async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
