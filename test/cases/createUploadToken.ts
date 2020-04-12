import * as test from 'tape';
import { FileGenerator } from '../../packages/fsd';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > createUploadToken`, async (troot) => {
    if (fsd.adapter.createUploadToken) {
      let token = await fsd.adapter.createUploadToken('/abc/test.txt');
      console.log('token', token);
    }

    troot.end();
  });
}
