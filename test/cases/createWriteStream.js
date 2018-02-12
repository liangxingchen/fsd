import test from 'tape';
import type { fsd as fsdFn } from 'fsd';
import sleep from '../utils';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > createWriteStream', (troot) => {
    let filePath = `awesome.txt`;
    let writePath = 'writeAwesome.txt';
    let str = 'hello world';
    troot.test(fsd.adapter.name + ' > before createWriteStream', async(t) => {
      let file = fsd(filePath);
      await file.write(str);
      await sleep(100);
      t.end();
    });

    troot.test(fsd.adapter.name + ' > createWriteStream awesome.txt writeAwesome.txt', async(t) => {
      let readFile = fsd(filePath);
      let writeFile = fsd(writePath);
      let readStream = await readFile.createReadStream();
      let writeStream = await writeFile.createWriteStream();
      await (new Promise((resolve, reject) => readStream.pipe(writeStream).on('end', resolve).on('error', reject).on('close', resolve)));
      await sleep(200);
      let txt = await writeFile.read('utf8');
      t.equal(txt, str, 'createWriteStream equal');
      writeFile.unlink().then();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear createWriteStream', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
