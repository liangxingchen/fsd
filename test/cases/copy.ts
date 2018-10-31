import test = require('tape');
import { fsd as fsdFn } from '../../packages/fsd'
import delay from 'delay';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > copy', (troot) => {
    const DIR_PATH = '/copy/';
    const SOURCE_PATH = '/copy/source.txt';
    const DIST_PATH = '/copy/dest.txt';
    const DIST_DIR_PATH = '/copy-dest/';
    const DIST_DIR_FILE_PATH = '/copy-dest/source.txt';
    const DATA_STRING = 'hello world';

    troot.test(fsd.adapter.name + ' > before copy', async(t) => {
      let dir = fsd(DIR_PATH);
      let file = fsd(SOURCE_PATH);
      if (!await dir.exists()) {
        await dir.mkdir();
      }
      await delay(200);
      t.ok(await dir.exists(), 'before copy: mkdir');
      await file.write(DATA_STRING);
      await delay(200);
      t.ok(await file.exists(), 'before copy: write file');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > copy file', async(t) => {
      let file = fsd(SOURCE_PATH);
      await file.copy(DIST_PATH);
      await delay(200);
      t.ok(await fsd(DIST_PATH).exists(), 'copied file ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > copy dir', async(t) => {
      let dir = fsd(DIR_PATH);
      await dir.copy(DIST_DIR_PATH);
      await delay(200);
      t.ok(await fsd(DIST_DIR_PATH).exists(), 'copied dir ok');
      let destFile = fsd(DIST_DIR_FILE_PATH);
      t.equal(await destFile.read('utf8'), DATA_STRING, 'copied file content ok');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear copy', async(t) => {
      await fsd(DIR_PATH).unlink();
      await fsd(DIST_DIR_PATH).unlink();
      t.end();
    });

    troot.end();
  });
}
