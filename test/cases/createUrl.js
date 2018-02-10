import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('createUrl', (troot) => {

    test('before createUrl', async(t) => {
      let dir = fsd('/abc/');
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    test('createUrl abc', async(t) => {
      let filePath = '/cases/createUrl.js';
      let dir = fsd(filePath);
      let createUrl = await dir.createUrl();
      t.equal(createUrl, 'http://localhost' + filePath, 'createUrl OK');
      t.end();
    });

    test('clear createUrl', async(t) => {
      let dir = fsd('/abc/');
      if (await dir.exists()) {
        await dir.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
