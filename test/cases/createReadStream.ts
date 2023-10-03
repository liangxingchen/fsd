import * as test from 'tape';
import type { FileGenerator } from '../../packages/fsd';
import delay from 'delay';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > createReadStream`, (troot) => {
    const ROOT = '/READ-STREAM/';
    const FILE = '/READ-STREAM/awesome.txt';
    const TEST = '/READ-STREAM/test.txt';
    let DATA = 'hello world';
    troot.test(`${fsd.adapter.name} > before createReadStream`, async (t) => {
      await fsd(ROOT).mkdir();
      let file = fsd(FILE);
      await file.write(DATA);
      await delay(100);
      let data = await file.read('utf8');
      t.equal(data, DATA, 'write data error');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > createReadStream awesome.txt`, async (t) => {
      let file = fsd(FILE);
      let testFile = fsd(TEST);

      let stream = await file.createReadStream();

      await testFile.write(stream);
      await delay(100);

      let readStr = await testFile.read('utf8');

      t.equal(readStr, DATA, 'createReadStream no options');
      await testFile.unlink();
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear createReadStream`, async (t) => {
      let file = fsd(ROOT);
      await file.unlink();
      t.end();
    });

    troot.end();
  });
}
