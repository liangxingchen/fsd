import test from 'tape';
import delay from 'delay';
import type { FileGenerator } from '../../packages/fsd';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > append`, (troot) => {
    const ROOT = fsd('/append/');
    const FILE = fsd(`/append/awesome.txt`);
    const TEST = fsd('/append/testAwesome.txt');
    const DATA = 'hello world';

    troot.test(`${fsd.adapter.name} > append string`, async (t) => {
      await ROOT.mkdir();
      await FILE.unlink();
      await delay(200);
      await FILE.append(DATA);
      await delay(200);
      let str = await FILE.read('utf8');
      t.equal(str, DATA, 'append string');
      await FILE.append(DATA);
      await delay(200);
      str = await FILE.read('utf8');
      t.equal(str, DATA + DATA, 'append string');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > append buffer`, async (t) => {
      await FILE.unlink();
      await delay(200);
      let buf = Buffer.from(DATA);
      await FILE.append(buf);
      let str = await FILE.read('utf8');
      t.equal(str, DATA, 'append buffer');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > append stream`, async (t) => {
      await TEST.unlink();
      let stream = await FILE.createReadStream();
      await TEST.append(stream);
      let readStr = await TEST.read('utf8');
      t.equal(readStr, DATA, 'append stream');
      await TEST.unlink();
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear append`, async (t) => {
      await ROOT.unlink();
      t.end();
    });

    troot.end();
  });
}
