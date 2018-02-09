import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('writePart', (troot) => {
    let filePath = '/a.js';

    test('before writePart', async(t) => {
      let file = fsd(filePath);
      await file.write();
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    test('writePart a.js', async(t) => {
      let file = fsd(filePath);
      await file.write('123');
      let part = 2;
      let parts = await file.initMultipartUpload(part);
      let res = parts.map(async(part) => {
        await file.writePart(part, 'test' + part);
      });
      await Promise.all(res);
      //await file.completeMultipartUpload(parts);
      t.end();
    });

    test('clear writePart', async(t) => {
      let file = fsd(filePath);

      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
