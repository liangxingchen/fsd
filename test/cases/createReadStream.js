import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('createReadStream', (troot) => {
    let filePath = `/awesome.txt`;
    test('before createReadStream', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append('hello world');
      }
      t.end();
    });

    test('createReadStream awesome.txt', async(t) => {
      let file = fsd(filePath);
      try {
        await file.createReadStream();
        t.ok(true, 'createReadStream no options');
      } catch (err) {
        t.notOk(err, 'createReadStream no options');
      }
      t.end();
    });

    test('clear createReadStream', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
