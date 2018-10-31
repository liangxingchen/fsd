import test = require('tape');
import { fsd as fsdFn } from '../../packages/fsd'
import delay from 'delay';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > initMultipartUpload', (troot) => {
    let filePath = 'a.js';

    troot.test(fsd.adapter.name + ' > before initMultipartUpload', async(t) => {
      let file = fsd(filePath);
      await file.write('test');
      await delay(100);
      t.ok(await file.exists(), 'write error');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > initMultipartUpload a.js', async(t) => {
      let file = fsd(filePath);
      let part = 2;
      let parts = await file.initMultipartUpload(part);
      t.equal(parts.length, part, 'initMultipartUpload OK');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear initMultipartUpload', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      t.end();
    });

    troot.end();
  });
}
