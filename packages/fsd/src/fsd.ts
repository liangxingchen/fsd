import File from './file';
import type { DriverOptions, FSDFile } from '..';

export default function FSD(options: DriverOptions) {
  function fsd(path: string | FSDFile) {
    return new File(path, options.adapter);
  }

  fsd.adapter = options.adapter;
  return fsd;
}
