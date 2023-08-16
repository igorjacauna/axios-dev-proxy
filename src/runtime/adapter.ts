/* eslint-disable max-classes-per-file */
import type { AxiosResponse, AxiosInstance, AxiosRequestConfig } from 'axios';

type RouteConfig = (
  config?: AxiosRequestConfig,
) => [number, unknown] | Promise<[number, unknown]> | void;

export default class Adapter {
  axios: AxiosInstance;

  proxies: number[] = [];

  toSkip: number[] = [];

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  setProxy(verb: string, path: string, status: number, mock: unknown): void;

  setProxy(verb: string, path: string, config: RouteConfig): void;

  setProxy(
    verb: string,
    path: string,
    statusCodeOrConfig?: number | RouteConfig,
    mock?: unknown,
  ) {
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (requestConfig.method === verb && requestConfig.url === path) {
        requestConfig.adapter = config => {
          this.eject(interceptorId);
          return new Promise((resolve, reject) => {
            if (typeof statusCodeOrConfig === 'function') {
              Promise.resolve(statusCodeOrConfig(requestConfig)).then(
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
            const status = statusCodeOrConfig || 200;
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

  eject(id: number) {
    this.axios.interceptors.request.eject(id);
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

  configure(verb: string, path: string) {
    return {
      reply: (
        statusCodeOrConfig: number | RouteConfig,
        mock?: unknown,
      ): Adapter => {
        if (typeof statusCodeOrConfig === 'function') {
          this.setProxy(verb, path, statusCodeOrConfig);
        } else {
          this.setProxy(verb, path, statusCodeOrConfig, mock);
        }
        return this;
      },
    };
  }

  onGet(path: string) {
    return this.configure('get', path);
  }

  onPost(path: string) {
    return this.configure('post', path);
  }

  onPut(path: string) {
    return this.configure('put', path);
  }

  onPatch(path: string) {
    return this.configure('patch', path);
  }
}
