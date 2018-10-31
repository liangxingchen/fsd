import test = require('tape');
import { fsd as fsdFn } from '../../packages/fsd'

export default function (fsd: fsdFn) {
  test(fsd.adapter.name + ' > read', (troot) => {
    let filePath = `/awesome.txt`;
    let str = 'hello world';
    troot.test(fsd.adapter.name + ' > before read', async(t) => {
      let file = fsd(filePath);
      if (!(await file.exists())) {
        await file.append(str);
      }
      t.end();
    });

    troot.test(fsd.adapter.name + ' > read awesome.txt encoding', async(t) => {
      let file = fsd(filePath);
      let res = await file.read('utf8');
      t.equal(res, str, 'read encoding');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > read awesome.txt position length', async(t) => {
      let file = fsd(filePath);
      let res = await file.read(2, 1);
      let eq = str.substr(2, 1);
      t.equal(res.toString(), eq, 'read position length');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > read awesome.txt position length encoding', async(t) => {
      let file = fsd(filePath);
      let res = await file.read(0, 4, 'utf8');
      let eq = str.substr(0, 4);
      t.equal(res, eq, 'read position length encoding');
      t.end();
    });

    troot.test(fsd.adapter.name + ' > clear read', async(t) => {
      let file = fsd(filePath);
      await file.unlink();
      t.end();
    });
    troot.end();
  });
}
