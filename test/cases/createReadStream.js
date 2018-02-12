import test from 'tape';
import type { fsd as fsdFn } from 'fsd';

import sleep from '../sleep';

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > createReadStream', (troot) => {
    let filePath = `awesome.txt`;
    let testPath = 'testAwesome.txt';
    let appendStr = 'hello world';
    troot.test(fsd.adapter.name + ' > before createReadStream', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.write(appendStr);
        await sleep(100);
      }
      let data=await file.read('utf8');
      t.equal(data,appendStr,'write data error')
      t.end();
    });

    troot.test(fsd.adapter.name + ' > createReadStream awesome.txt', async(t) => {
      let file = fsd(filePath);
      let testFile = fsd(testPath);
      
      let stream = await file.createReadStream();
    
      await testFile.write(stream);
      await sleep(100);
   
      let readStr = await testFile.read('utf8');
      
      t.equal(readStr, appendStr, 'createReadStream no options');
      await testFile.unlink();
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear createReadStream', async(t) => {
      let file = fsd(filePath);
      if (await file.exists()) {
        await file.unlink();
      }
      t.end();
    });

    troot.end();
  });
}
