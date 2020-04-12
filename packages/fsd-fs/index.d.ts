import { Adapter } from 'fsd';

export interface FSAdapterOptions {
  root: string;
  mode?: number;
  urlPrefix?: string;
  tmpdir?: string;
}

export default class FSAdapter extends Adapter<FSAdapterOptions> {}
