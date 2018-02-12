import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > exists', (troot) => {
    let dirPath = '/abc/bcd/';
    let validPath = '/qwe/asd';
    troot.test(fsd.adapter.name + ' > exists true', async(t) => {
      let dir = fsd(dirPath);
      await dir.mkdir(true);
      let isExists = await dir.exists();
      t.ok(isExists, 'exists true OK');
      await dir.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > exists false', async(t) => {
      let dir = fsd(validPath);
      await dir.unlink();
      let isExists = await dir.exists();
      t.ok(!isExists, 'exists false Ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear exists', async(t) => {
      let file = fsd(dirPath);
      let validFile = fsd(validPath);
      if (await file.exists()){
        await file.unlink();
      }
      if (await validFile.exists()){
        await validFile.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
