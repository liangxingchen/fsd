import test = require('tape');
import { fsd as fsdFn } from '../../packages/fsd'
import delay from 'delay';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > mkdir', (troot) => {
    const DIR = fsd('/abc/');
    const SUB_DIR = fsd('/abc/mk/mk/');

    troot.test(fsd.adapter.name + ' > mkdir', async (t) => {
      await DIR.mkdir();
      await delay(200);
      t.ok(await DIR.exists(), 'mkdir');
      await DIR.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > mkdir sub dir', async (t) => {
      await SUB_DIR.mkdir(true);
      t.ok(await SUB_DIR.exists(), 'mkdir sub dir');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > mkdir clear', async (t) => {
      await DIR.unlink();
      await delay(200);
      t.ok(!await SUB_DIR.exists(), 'remove sub dir');
      t.end();
    });

    troot.end();
  });
}
