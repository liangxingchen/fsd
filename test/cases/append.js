import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {

  test('append', (troot) => {
    let filePath = `/awesome.txt`;
    test('append test.txt string', async(t) => {
      let file = fsd(filePath);
      try {
        await file.append('hello world\n')
      } catch (err) {
        t.ok(!err, 'append hello world');
      }
      t.end();
    });

    test('clear append', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
