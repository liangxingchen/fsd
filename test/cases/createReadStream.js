import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('createReadStream', (troot) => {
    let filePath = `/awesome.txt`;
    let testPath = '/testAwesome.txt';
    let appendStr = 'hello world';
    test('before createReadStream', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append(appendStr);
      }
      t.end();
    });

    test('createReadStream awesome.txt', async(t) => {
      let file = fsd(filePath);
      let testFile = fsd(testPath);
      let stream = await file.createReadStream();
      await testFile.write(stream);
      let readStr = await testFile.read('utf8');
      t.equal(readStr, appendStr, 'createReadStream no options');
      await testFile.unlink();
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
