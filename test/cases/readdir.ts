import test = require('tape');
import _ = require('lodash');
import { fsd as fsdFn } from '../../packages/fsd'
import delay from 'delay';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > readdir', (troot) => {
    let dirPath = '/abc/';
    let filePaths = ['/abc/a.js', '/abc/b.js', '/abc/c.js'];
    let appendStr = 'hello world';

    troot.test(fsd.adapter.name + ' > before readdir', async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      await dir.mkdir(true);
      await delay(200);
      await Promise.all(filePaths.map(async (item) => {
        let file = fsd(item);
        if (!(await file.exists())) {
          await file.write(appendStr);
        }
      }));
      await delay(200);
      t.end();
    });

    troot.test(fsd.adapter.name + ' > readdir /abc', async (t) => {
      let dir = fsd(dirPath);
      let files = await dir.readdir();
      let names = _.map(files, (file) => file.path);
      t.deepEqual(names, filePaths, 'readdir /abc ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear readdir', async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
