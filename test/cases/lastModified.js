import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../sleep';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > lastModified', (troot) => {
    let DIR = fsd('/size/');
    let FILE = fsd('/size/file.txt');
    let APPEND = fsd('/size/append.txt');
    let DATA = 'hello world';

    troot.test(fsd.adapter.name + ' > before lastModified', async (t) => {
      await DIR.unlink();
      await DIR.mkdir();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > lastModified date', async (t) => {
      await FILE.write(DATA);
      await sleep(200);
      t.ok((await FILE.lastModified()) instanceof Date, 'Date type');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > lastModified after append', async (t) => {
      await APPEND.append(DATA);
      let time1 = await APPEND.lastModified();
      t.ok(time1 instanceof Date, 'Date type');
      await sleep(1200);
      await APPEND.append(DATA);
      await sleep(200);
      let time2 = await APPEND.lastModified();
      t.ok(time2 instanceof Date, 'Date type');
      console.log('time1', time1);
      console.log('time2', time2);
      t.ok(time2 > time1, 'Date changed');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear size', async (t) => {
      await DIR.unlink();
      t.end();
    });

    troot.end();
  });
}
