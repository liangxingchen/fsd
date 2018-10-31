import { DriverOptions, FSDFile } from '..';

const File = require('./file');

module.exports = function FSD(options: DriverOptions) {
  function fsd(path: string | FSDFile) {
    return new File(path, options.adapter);
  }

  fsd.adapter = options.adapter;
  return fsd;
}
