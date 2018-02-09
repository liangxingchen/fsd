import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('rename', (troot) => {
    let dirPath = '/abc';
    let renameDirPath = '/ab';
    
    test('before rename', async(t) => {
      let dir = fsd(dirPath);
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    test('rename "/abc"->"/ab"', async(t) => {
      let dir = fsd(dirPath);
      await dir.rename(renameDirPath);
      let renameDir = fsd(renameDirPath);
      t.equal(renameDir.path, renameDirPath, 'rename "/abc"->"/ab" OK');
      t.end();
    });

    test('clear rename', async(t) => {
      let renameDir = fsd(renameDirPath);
      if (await renameDir.exists()) {
        await renameDir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
