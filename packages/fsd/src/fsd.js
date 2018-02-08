// @flow

import type { DriverOptions } from 'fsd';

const FSDFile = require('./file');

function FSD(options: DriverOptions) {
  return function fsd(path: string) {
    return new FSDFile(path, options.adapter);
  };
}

module.exports = FSD;
