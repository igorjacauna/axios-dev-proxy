import type {
  AxiosResponse,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { isEqual } from 'ohash';

type RouteConfig = (
  config?: AxiosRequestConfig,
) => [number, unknown] | Promise<[number, unknown]>;

type RequestConfigChanger = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig;

export default class Adapter {
  axios: AxiosInstance;

  verb!: string;

  path!: string;

  params?: object;

  once: boolean;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
    this.once = false;
  }

  private hasSameParams(requestParams: object, proxyParams?: object) {
    if (!proxyParams) return true;
    return isEqual(requestParams, proxyParams);
  }

  private matchRequest(
    verb: string,
    path: string,
    config: AxiosRequestConfig,
    params?: object,
  ) {
    return (
      config.method === verb &&
      config.url === path &&
      this.hasSameParams(config.params, params)
    );
  }

  private matchResponse(
    verb: string,
    path: string,
    response: AxiosResponse,
    params?: object,
  ) {
    return (
      response.config.method === verb &&
      response.config.url === path &&
      this.hasSameParams(response.config.params, params)
    );
  }

  private setProxy(statusCodeOrFunction: number | RouteConfig, mock?: unknown) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const onceConfig = this.once;
    const paramsConfig = this.params;
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (
        this.matchRequest(verbConfig, pathConfig, requestConfig, paramsConfig)
      ) {
        requestConfig.adapter = config => {
          if (onceConfig) this.ejectFromRequest(interceptorId);
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

  private setRequestConfigChanger(configChanger: RequestConfigChanger) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const interceptorId = this.axios.interceptors.request.use(requestConfig => {
      if (
        this.matchRequest(verbConfig, pathConfig, requestConfig, paramsConfig)
      ) {
        if (this.once) this.ejectFromRequest(interceptorId);
        const result = configChanger(requestConfig);
        return result;
      }
      return requestConfig;
    });
  }

  private setPrintableResponse() {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const onceConfig = this.once;
    const interceptorId = this.axios.interceptors.response.use(response => {
      if (this.matchResponse(verbConfig, pathConfig, response, paramsConfig)) {
        if (onceConfig) this.ejectFromResponse(interceptorId);
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

  private ejectFromRequest(id: number) {
    this.axios.interceptors.request.eject(id);
  }

  private ejectFromResponse(id: number) {
    this.axios.interceptors.response.eject(id);
  }

  clear() {
    this.axios.interceptors.request.clear();
    this.axios.interceptors.response.clear();
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
    this.once = false;
    this.setRequestConfigChanger(changer);
    return this;
  }

  changeRequestOnce(changer: RequestConfigChanger) {
    this.once = true;
    this.setRequestConfigChanger(changer);
    return this;
  }

  printResponse() {
    this.once = false;
    this.setPrintableResponse();
    return this;
  }

  printResponseOnce() {
    this.once = true;
    this.setPrintableResponse();
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
