import test = require('tape');
import { fsd as fsdFn } from '../../packages/fsd'

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > exists', (troot) => {
    let ROOT = '/exists/';
    let dirPath = '/exists/abc/bcd/';
    let validPath = '/exists/qwe/asd';
    troot.test(fsd.adapter.name + ' > exists true', async (t) => {
      let dir = fsd(dirPath);
      await dir.mkdir(true);
      let isExists = await dir.exists();
      t.ok(isExists, 'exists true OK');
      await dir.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > exists false', async (t) => {
      let dir = fsd(validPath);
      await dir.unlink();
      let isExists = await dir.exists();
      t.ok(!isExists, 'exists false Ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear exists', async (t) => {
      let root = fsd(ROOT);
      await root.unlink();
      t.end();
    });

    troot.end();
  });
}
