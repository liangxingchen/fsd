import { Adapter } from 'fsd';

declare namespace FSAdapter {
  interface FSAdapterOptions {
    root: string;
    mode?: number;
    urlPrefix?: string;
    tmpdir?: string;
  }

}

// eslint-disable-next-line no-redeclare
declare class FSAdapter extends Adapter<FSAdapter.FSAdapterOptions> {
}

export = FSAdapter;
