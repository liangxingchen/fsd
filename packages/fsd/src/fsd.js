// @flow

import type { DriverOptions } from 'fsd';

const FSDFile = require('./file');

function FSD(options: DriverOptions) {
  function fsd(path: string | FSDFile) {
    return new FSDFile(path, options.adapter);
  }

  fsd.adapter = options.adapter;
  return fsd;
}

module.exports = FSD;
