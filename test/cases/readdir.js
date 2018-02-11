import test from 'tape';
import _ from 'lodash';
import Path from 'path';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('readdir', (troot) => {
    let dirPath = 'abc/';
    let filePaths = ['abc/abc/a.js', 'abc/b.js', 'abc/c.js', 'abc/a/d.js'];
    let appendStr = 'hello world';

    test('before readdir', async(t) => {
      let dir = fsd(dirPath);
      if (!(await dir.exists(true))) {
        await dir.mkdir(true);
      }
      await Promise.all(filePaths.map(async(item) => {
        let file = fsd(item);
        if (!(await file.exists())) {
          await file.write(appendStr);
        }
      }));
      t.end();
    });

    test('readdir abc', async(t) => {
      let dir = fsd(dirPath);
      let files = await dir.readdir();
      let names = _.map(files, (file) => Path.join(dirPath, file.path));
      let arr = _.intersection(names, filePaths);
      t.equal(arr.length, filePaths.length, 'readdir OK');
      t.end();
    });

    test('clear readdir', async(t) => {
      let dir = fsd(dirPath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });
    
    troot.end();
  });
}
