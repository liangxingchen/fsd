import * as test from 'tape';
import { fsd as fsdFn } from '../../packages/fsd';

export default function (fsd: fsdFn) {
  test(`${fsd.adapter.name} > toJSON`, (troot) => {
    let dirPath = '/abc/';

    troot.test(`${fsd.adapter.name} > before toJSON`, async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > toJSON`, async (t) => {
      let dir = fsd(dirPath);
      let data = await dir.toJSON();
      t.equal(data, dirPath, 'toJSON OK');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear toJSON`, async (t) => {
      let dir = fsd(dirPath);
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
