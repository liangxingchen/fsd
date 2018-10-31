import test = require('tape');
import { fsd as fsdFn } from '../../packages/fsd'

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > createUrl', (troot) => {

    troot.test(fsd.adapter.name + ' > before createUrl', async (t) => {
      let dir = fsd('/abc/');
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > createUrl abc', async (t) => {
      let filePath = '/cases/createUrl.js';
      let dir = fsd(filePath);
      let createUrl = await dir.createUrl();
      t.ok(createUrl.length, 'createUrl OK');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear createUrl', async (t) => {
      let dir = fsd('/abc/');
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
