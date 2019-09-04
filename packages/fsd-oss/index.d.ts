import { Adapter } from 'fsd';

declare namespace OSSAdpter {
  interface OSSAdapterOptions {
    root?: string;
    urlPrefix?: string;
    publicRead?: boolean;
    accessKeyId: string;
    accessKeySecret: string;
    stsToken?: string;
    bucket?: string;
    region?: string;
    internal?: boolean;
    secure?: boolean;
    endpoint?: string;
    timeout?: string | number;
  }
}

// eslint-disable-next-line no-redeclare
declare class OSSAdpter extends Adapter<OSSAdpter.OSSAdapterOptions> {}

export = OSSAdpter;
