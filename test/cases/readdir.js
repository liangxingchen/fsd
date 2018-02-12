import test from 'tape';
import _ from 'lodash';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../sleep';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > readdir', (troot) => {
    let dirPath = '/abc/';
    let filePaths = ['/abc/a.js', '/abc/b.js', '/abc/c.js'];
    let appendStr = 'hello world';

    troot.test(fsd.adapter.name + ' > before readdir', async(t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      await dir.mkdir(true);
      await sleep(200);
      await Promise.all(filePaths.map(async(item) => {
        let file = fsd(item);
        if (!(await file.exists())) {
          await file.write(appendStr);
        }
      }));
      await sleep(200);
      t.end();
    });

    troot.test(fsd.adapter.name + ' > readdir /abc', async(t) => {
      let dir = fsd(dirPath);
      let files = await dir.readdir();
      let names = _.map(files, (file) => file.path);
      t.deepEqual(names, filePaths, 'readdir /abc ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear readdir', async(t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
