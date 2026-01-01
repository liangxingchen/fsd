import test from 'tape';
import type { FileGenerator } from '../../packages/fsd';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > createUploadToken`, async (troot) => {
    if (fsd.adapter.createUploadToken) {
      let token = await fsd.adapter.createUploadToken('/abc/test.txt');
      console.log('upload token', token);
    }

    troot.end();
  });
}
