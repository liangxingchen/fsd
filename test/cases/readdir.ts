import test from 'tape';
import _ from 'lodash';
import type { FileGenerator } from '../../packages/fsd';
import delay from 'delay';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > readdir`, (troot) => {
    let dirPath = '/abc/';
    let filePaths = ['/abc/a.js', '/abc/b.js', '/abc/c.js', '/abc/sub/', '/abc/z.js'];
    let appendStr = 'hello world';

    troot.test(`${fsd.adapter.name} > before readdir`, async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      await dir.mkdir(true);
      await delay(200);
      await Promise.all(
        filePaths.map(async (item) => {
          let file = fsd(item);
          if (!(await file.exists())) {
            if (item.endsWith('/')) {
              await file.mkdir(true);
            } else {
              await file.write(appendStr);
            }
          }
        })
      );
      await delay(200);
      t.end();
    });

    troot.test(`${fsd.adapter.name} > readdir /abc`, async (t) => {
      let dir = fsd(dirPath);
      let files = await dir.readdir();
      let names = _.map(files, (file) => file.path);
      t.deepEqual(names, filePaths, 'readdir /abc ok');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > readdir recursion`, async (t) => {
      let dir = fsd(dirPath);
      await fsd(`${dirPath}123/`).mkdir();
      await fsd(`${dirPath}123/sub.txt`).append('test');
      let files = await dir.readdir(true);
      t.ok(
        files.find((f) => f.path === `${dirPath}123/`),
        'readdir with subdir'
      );
      t.ok(
        files.find((f) => f.path === `${dirPath}123/sub.txt`),
        'readdir recursion'
      );
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear readdir`, async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
