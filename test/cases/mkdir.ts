import * as test from 'tape';
import { FileGenerator } from '../../packages/fsd';
import delay from 'delay';

export default function (fsd: FileGenerator) {
  test(`${fsd.adapter.name} > mkdir`, (troot) => {
    const DIR = fsd('/mkdir/');
    const SUB1 = fsd('/mkdir/mk/sub/1/');
    const SUB2 = fsd('/mkdir/mk/sub/2/');
    const FILE = fsd('/mkdir/auto/make/parent/dir.txt');

    troot.test(`${fsd.adapter.name} > mkdir`, async (t) => {
      await DIR.mkdir();
      await delay(200);
      t.ok(await DIR.exists(), 'mkdir');
      await DIR.unlink();
      t.end();
    });

    troot.test(`${fsd.adapter.name} > mkdir sub dir`, async (t) => {
      await SUB1.mkdir(true);
      t.ok(await SUB1.exists(), 'mkdir sub dir');
      await SUB2.mkdir(true);
      t.ok(await SUB2.exists(), 'mkdir sub dir');
      t.end();
    });

    troot.test(`${fsd.adapter.name} > ensure parent dir`, async (t) => {
      if (FILE.needEnsureDir) {
        let dir = fsd(FILE.dir);
        await dir.mkdir(true);
        t.ok(await dir.exists());
      }
      await FILE.write('test');
      await delay(200);
      t.ok(await FILE.exists());
      await DIR.unlink();
      if (FILE.needEnsureDir) {
        try {
          await FILE.write('test');
          t.fail('should throw error if needEnsureDir');
        } catch (e) {
          // should throw error
          t.pass('throw error if needEnsureDir');
        }
      }
      t.end();
    });

    troot.test(`${fsd.adapter.name} > mkdir clear`, async (t) => {
      await DIR.unlink();
      await delay(200);
      t.ok(!(await SUB1.exists()), 'remove sub dir');
      t.end();
    });

    troot.end();
  });
}
