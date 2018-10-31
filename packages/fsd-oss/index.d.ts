import { Adapter } from 'fsd';

declare namespace OSSAdpter {
  interface OSSAdapterOptions {
    root?: string;
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

declare class OSSAdpter extends Adapter<OSSAdpter.OSSAdapterOptions> {
}

export = OSSAdpter;
