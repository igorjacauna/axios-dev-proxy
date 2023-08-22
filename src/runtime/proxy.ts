import type { AxiosResponse, AxiosInstance } from 'axios';
import {
  clearAll,
  ejectFromRequest,
  ejectFromResponse,
  matchRequest,
  matchResponse,
} from './helpers';

export default class Proxy {
  axios: AxiosInstance;

  verb!: string;

  path!: string;

  params?: object;

  once: boolean;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
    this.once = false;
  }

  private setProxy(statusCodeOrFunction: number | RouteConfig, mock?: unknown) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const onceConfig = this.once;
    const paramsConfig = this.params;
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (matchRequest(verbConfig, pathConfig, requestConfig, paramsConfig)) {
        requestConfig.adapter = config => {
          if (onceConfig) ejectFromRequest(this.axios, interceptorId);
          return new Promise((resolve, reject) => {
            if (typeof statusCodeOrFunction === 'function') {
              Promise.resolve(statusCodeOrFunction(requestConfig)).then(
                result => {
                  const [status, data] = result;
                  const response = {
                    data,
                    status,
                    headers: {},
                    statusText: '',
                    config,
                    request: requestConfig,
                  };
                  if (status < 400) resolve(response);
                  else reject(response);
                },
              );
              return;
            }
            const status = statusCodeOrFunction;
            const response: AxiosResponse = {
              data: mock,
              status,
              headers: {},
              statusText: '',
              config,
              request: requestConfig,
            };

            if (status < 400) resolve(response);
            else reject(response);
          });
        };
      }
      return requestConfig;
    });
  }

  private setRequestConfigChanger(
    configChanger: RequestConfigChanger,
    once = false,
  ) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (matchRequest(verbConfig, pathConfig, requestConfig, paramsConfig)) {
        if (once) ejectFromRequest(this.axios, interceptorId);
        const result = configChanger(requestConfig);
        return result;
      }
      return requestConfig;
    });
  }

  private setPrintableResponse(once = false) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const interceptorId = this.axios.interceptors.response.use(response => {
      if (matchResponse(verbConfig, pathConfig, response, paramsConfig)) {
        if (once) ejectFromResponse(this.axios, interceptorId);
        console.log('Response from:', this.path);
        console.log(JSON.stringify(response.data, null, 2));
      }
      return response;
    });
  }

  private setup(verb: string, path: string, params?: object) {
    this.verb = verb;
    this.path = path;
    this.params = params;
    return this;
  }

  clear() {
    clearAll(this.axios);
  }

  reply(statusCodeOrConfig: number | RouteConfig, mock?: unknown) {
    this.once = false;
    this.setProxy(statusCodeOrConfig, mock);
    return this;
  }

  replyOnce(statusCodeOrConfig: number | RouteConfig, mock?: unknown) {
    this.once = true;
    this.setProxy(statusCodeOrConfig, mock);
    return this;
  }

  changeRequest(changer: RequestConfigChanger) {
    this.setRequestConfigChanger(changer);
    return this;
  }

  changeRequestOnce(changer: RequestConfigChanger) {
    this.setRequestConfigChanger(changer, true);
    return this;
  }

  printResponse() {
    this.setPrintableResponse();
    return this;
  }

  printResponseOnce() {
    this.setPrintableResponse(true);
    return this;
  }

  onGet(path: string, params?: object) {
    return this.setup('get', path, params);
  }

  onPost(path: string, params?: object) {
    return this.setup('post', path, params);
  }

  onPut(path: string, params?: object) {
    return this.setup('put', path, params);
  }

  onPatch(path: string, params?: object) {
    return this.setup('patch', path, params);
  }
}
