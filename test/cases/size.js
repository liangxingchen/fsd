import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../sleep';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > size', (troot) => {
    let DIR = fsd('/size/');
    let EMPTY = fsd('/size/empty.txt');
    let FILE = fsd('/size/file.txt');
    let APPEND = fsd('/size/append.txt');
    let DATA = 'hello world';

    troot.test(fsd.adapter.name + ' > dir size', async (t) => {
      await DIR.unlink();
      await DIR.mkdir();
      await sleep(200);
      t.equal(await DIR.size(), 0, 'dir size 0');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > file size', async (t) => {
      await EMPTY.append('');
      await sleep(200);
      t.equal(await EMPTY.size(), 0, 'empty file');
      await FILE.write(DATA);
      await sleep(200);
      t.equal(await FILE.size(), DATA.length, 'file size');
      await APPEND.append(DATA);
      await sleep(200);
      await APPEND.append(DATA);
      await sleep(200);
      t.equal(await APPEND.size(), DATA.length * 2, 'file size after append');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear size', async (t) => {
      await DIR.unlink();
      t.end();
    });

    troot.end();
  });
}
