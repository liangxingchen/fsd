import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('write', (troot) => {
    let filePath = `/awesome.txt`;
    test('before write', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append('');
      }
      t.end();
    });

    test('write awesome.txt string', async(t) => {
      let file = fsd(filePath);
      try {
        await file.write('hello world\n');
        t.ok(true, 'write string');
      } catch (err) {
        t.notOk(err, 'write string');
      }
      t.end();
    });

    test('write awesome.txt buffer', async(t) => {
      let file = fsd(filePath);
      try {
        await file.write(Buffer.from('hello world\n'));
        t.ok(true, 'write buffer');
      } catch (err) {
        t.notOk(err, 'write buffer');
      }
      t.end();
    });

    test('write awesome.txt stream', async(t) => {
      let file = fsd(filePath);
      let readFrom = fsd('/readFrom.txt');
      await readFrom.append('hello world\n');
      let readStream = await readFrom.createReadStream();
      try {
        await file.write(readStream);
        t.ok(true, 'write stream');
      } catch (err) {
        t.notOk(err, 'write stream');
      }
      await readFrom.unlink();
      t.end();
    });

    test('clear write', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
