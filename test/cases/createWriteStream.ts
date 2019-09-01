import * as test from 'tape';
import { fsd as fsdFn } from '../../packages/fsd';
import delay from 'delay';

export default function (fsd: fsdFn) {
  test(`${fsd.adapter.name} > createWriteStream`, (troot) => {
    let filePath = `awesome.txt`;
    let writePath = 'writeAwesome.txt';
    let str = 'hello world';
    troot.test(`${fsd.adapter.name} > before createWriteStream`, async (t) => {
      let file = fsd(filePath);
      await file.write(str);
      await delay(100);
      t.end();
    });

    troot.test(`${fsd.adapter.name} > createWriteStream awesome.txt writeAwesome.txt`, async (t) => {
      let readFile = fsd(filePath);
      let writeFile = fsd(writePath);
      let readStream = await readFile.createReadStream();
      let writeStream = await writeFile.createWriteStream();
      await (new Promise((resolve, reject) => readStream.pipe(writeStream).on('end', resolve).on('error', reject).on('close', resolve)));
      await delay(200);
      let txt = await writeFile.read('utf8');
      t.equal(txt, str, 'createWriteStream equal');
      writeFile.unlink().then();
      t.end();
    });

    troot.test(`${fsd.adapter.name} > clear createWriteStream`, async (t) => {
      let file = fsd(filePath);
      await file.unlink();
      t.end();
    });

    troot.end();
  });
}
