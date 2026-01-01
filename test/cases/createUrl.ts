import test from 'tape';
import type { FileGenerator } from '../../packages/fsd';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > createUrl`, (troot) => {
    troot.test(`${fsd.adapter.name} > before createUrl`, async (t) => {
      let dir = fsd('/abc/');
      await dir.mkdir();
      t.ok(await dir.exists(), 'mkdir error');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > createUrl abc`, async (t) => {
      let filePath = '/cases/createUrl.js';
      let dir = fsd(filePath);
      let url = await dir.createUrl();
      t.ok(url.length, 'createUrl OK');
      t.ok(url.startsWith('http://localhost/'), url);
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear createUrl`, async (t) => {
      let dir = fsd('/abc/');
      await dir.unlink();
      t.end();
    });

    troot.end();
  });
}
