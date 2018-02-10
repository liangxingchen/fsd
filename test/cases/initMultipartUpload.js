import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {
  test('initMultipartUpload', (troot) => {
    let filePath = 'a.js';

    test('before initMultipartUpload', async(t) => {
      let file = fsd(filePath);
      await file.write('test');
      await sleep(100);
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    test('initMultipartUpload a.js', async(t) => {
      let file = fsd(filePath);
      let part = 2;
      let parts = await file.initMultipartUpload(part);
      t.equal(parts.length, part, 'initMultipartUpload OK');
      t.end();
    });

    test('clear initMultipartUpload', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
