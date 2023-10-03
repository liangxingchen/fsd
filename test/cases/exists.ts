import * as test from 'tape';
import delay from 'delay';
import type { FileGenerator } from '../../packages/fsd';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > exists`, (troot) => {
    let ROOT = '/exists/';
    let dirPath = '/exists/abc/bcd/';
    let validPath = '/exists/qwe/asd';
    troot.test(`${fsd.adapter.name} > exists true`, async (t) => {
      let dir = fsd(dirPath);
      await dir.mkdir(true);
      let isExists = await dir.exists();
      t.ok(isExists, 'exists true OK');
      await dir.unlink();
      await delay(200);

      isExists = await dir.exists();
      t.ok(!isExists, 'exists false OK');

      let root = fsd(ROOT);
      isExists = await root.exists();
      t.ok(isExists, 'exists true OK');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > exists false`, async (t) => {
      let dir = fsd(validPath);
      await dir.unlink();
      let isExists = await dir.exists();
      t.ok(!isExists, 'exists false Ok');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear exists`, async (t) => {
      let root = fsd(ROOT);
      await root.unlink();
      t.end();
    });

    troot.end();
  });
}
