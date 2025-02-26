import type { AxiosInstance } from 'axios';
import { DocGenerator } from './docGenerator';
import Handler from './handler';
import { clearAll } from './helpers';

export default class Proxy {
  axios: AxiosInstance;

  verb!: string;

  path!: string;

  params?: object;

  docGenerator?: DocGenerator;

  constructor(axios: AxiosInstance, generateDocs = false) {
    this.axios = axios;
    if (generateDocs) this.docGenerator = new DocGenerator();
  }

  private setup(verb: string, path: string | RegExp, params?: object) {
    const handler = new Handler(this, verb, path, params, this.docGenerator);
    return handler;
  }

  clear() {
    clearAll(this.axios);
  }

  onGet(path: string | RegExp, params?: object) {
    return this.setup('get', path, params);
  }

  onPost(path: string | RegExp, params?: object) {
    return this.setup('post', path, params);
  }

  onPut(path: string | RegExp, params?: object) {
    return this.setup('put', path, params);
  }

  onPatch(path: string | RegExp, params?: object) {
    return this.setup('patch', path, params);
  }
}
