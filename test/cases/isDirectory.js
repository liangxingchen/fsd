import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

export default function (fsd: fsdFn) {
  test('isDirectory', (troot) => {
    let dirPath = '/abc';
    let filePath = '/abc/a.js';
    
    test('before isDirectory', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      await dir.mkdir();
      await file.write();
      t.ok(await dir.exists(), 'mkdir error');
      t.ok(await file.exists(), 'write error');
      t.end();
    });
    
    test('isDirectory true', async(t) => {
      let dir = fsd(dirPath);
      let isDirectory = await dir.isDirectory();
      t.ok(isDirectory, 'isDirectory true ok');
      t.end();
    });
    
    test('isDirectory false', async(t) => {
      let dir = fsd(filePath);
      let isDirectory = await dir.isDirectory();
      t.notOk(isDirectory, 'isDirectory false ok');
      t.end();
    });
    
    test('clear isDirectory', async(t) => {
      let dir = fsd(dirPath);
      let file = fsd(filePath);
      if (await dir.exists()) {
        await dir.unlink();
      }
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });
    
    troot.end();
  });
}
