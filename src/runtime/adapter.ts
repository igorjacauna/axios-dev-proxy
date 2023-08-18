import type {
  AxiosResponse,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { isEqual } from 'ohash';

type RouteConfig = (
  config?: AxiosRequestConfig,
) => [number, unknown] | Promise<[number, unknown]> | void;

type RequestConfigChanger = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig;

export default class Adapter {
  axios: AxiosInstance;

  proxies: number[] = [];

  toSkip: number[] = [];

  verb!: string;

  path!: string;

  params?: object;

  once: boolean;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
    this.once = false;
  }

  hasSameParams(requestParams: object, proxyParams?: object) {
    if (!proxyParams) return true;
    return isEqual(requestParams, proxyParams);
  }

  setProxy(
    verb: string,
    path: string,
    status: number,
    mock: unknown,
    params?: object,
  ): void;

  setProxy(verb: string, path: string, status: number, mock: unknown): void;

  setProxy(verb: string, path: string, config: RouteConfig): void;

  setProxy(
    verb: string,
    path: string,
    statusCodeOrFunction?: number | RouteConfig,
    mock?: unknown,
    params?: object,
  ) {
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (
        requestConfig.method === verb &&
        requestConfig.url === path &&
        this.hasSameParams(requestConfig.params, params)
      ) {
        requestConfig.adapter = config => {
          if (this.once) this.ejectFromRequest(interceptorId);
          return new Promise((resolve, reject) => {
            if (typeof statusCodeOrFunction === 'function') {
              Promise.resolve(statusCodeOrFunction(requestConfig)).then(
                result => {
                  if (!result) return;
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
            const status = statusCodeOrFunction || 200;
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
    this.addToProxyStack(interceptorId);
  }

  setRequestConfigChanger(
    verb: string,
    path: string,
    configChanger: RequestConfigChanger,
    once: boolean,
  ) {
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (requestConfig.method === verb && requestConfig.url === path) {
        if (once) this.ejectFromRequest(interceptorId);
        const result = configChanger(requestConfig);
        return result;
      }
      return requestConfig;
    });
  }

  setPrintableResponse(verb: string, path: string, once: boolean) {
    const interceptorId = this.axios.interceptors.response.use(response => {
      if (response.config.method === verb && response.config.url === path) {
        if (once) this.ejectFromRequest(interceptorId);
        console.log('Response from:', this.path);
        console.log(JSON.stringify(response.data, null, 2));
      }
      return response;
    });
  }

  ejectFromRequest(id: number) {
    this.axios.interceptors.request.eject(id);
  }

  ejectFromResponse(id: number) {
    this.axios.interceptors.response.eject(id);
  }

  addToProxyStack(id: number) {
    this.proxies.push(id);
  }

  removeFromStack(id: number) {
    const index = this.proxies.indexOf(id);
    this.proxies.splice(index, 1);
  }

  addToSkip(id: number) {
    this.toSkip.push(id);
  }

  removeFromSkip(id: number) {
    const index = this.toSkip.indexOf(id);
    this.toSkip.splice(index, 1);
  }

  isToSkip(id: number) {
    return this.toSkip.includes(id);
  }

  setup(verb: string, path: string, params?: object) {
    this.verb = verb;
    this.path = path;
    this.params = params;
    return this;
  }

  reply(statusCodeOrConfig: number | RouteConfig, mock?: unknown) {
    if (typeof statusCodeOrConfig === 'function') {
      this.setProxy(this.verb, this.path, statusCodeOrConfig);
    } else {
      this.setProxy(
        this.verb,
        this.path,
        statusCodeOrConfig,
        mock,
        this.params,
      );
    }
    return this;
  }

  changeRequest(changer: RequestConfigChanger, once = false) {
    this.setRequestConfigChanger(this.verb, this.path, changer, once);
    return this;
  }

  printResponse(once = false) {
    this.setPrintableResponse(this.verb, this.path, once);
    return this;
  }

  onGet(path: string, params?: object) {
    this.once = false;
    return this.setup('get', path, params);
  }

  onPost(path: string, params?: object) {
    this.once = false;
    return this.setup('post', path, params);
  }

  onPut(path: string, params?: object) {
    this.once = false;
    return this.setup('put', path, params);
  }

  onPatch(path: string, params?: object) {
    this.once = false;
    return this.setup('patch', path, params);
  }

  onceGet(path: string, params?: object) {
    this.once = true;
    return this.setup('get', path, params);
  }

  oncePost(path: string, params?: object) {
    this.once = true;
    return this.setup('post', path, params);
  }

  oncePut(path: string, params?: object) {
    this.once = true;
    return this.setup('put', path, params);
  }

  oncePatch(path: string, params?: object) {
    this.once = true;
    return this.setup('patch', path, params);
  }
}
