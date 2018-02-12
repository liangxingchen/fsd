import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > rename', (troot) => {
    let dirPath = '/abc/bcd/';
    let renameDirPath = '/ab/';

    troot.test(fsd.adapter.name + ' > before rename', async(t) => {
      let dir = fsd(dirPath);
      await dir.mkdir(true);
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > rename "/abc"->"/ab"', async(t) => {
      let dir = fsd(dirPath);
      await dir.rename(renameDirPath);
      let renameDir = fsd(renameDirPath);
      let dirExists = await dir.exists();
      let renameExists = await renameDir.exists();
      t.ok(!dirExists && renameExists && renameDir.path === renameDirPath, 'rename "/abc"->"/ab" OK');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear rename', async(t) => {
      let renameDir = fsd(renameDirPath);
      let dir = fsd(dirPath);
      await dir.unlink();
      await renameDir.unlink();
      t.end();
    });

    troot.end();
  });
}
