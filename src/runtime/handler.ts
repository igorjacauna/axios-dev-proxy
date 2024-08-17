import type { AxiosResponse } from 'axios';
import type {
  RequestConfigChanger,
  ResponseChanger,
  RouteConfig,
} from '../types';
import {
  ejectFromRequest,
  ejectFromResponse,
  matchRequest,
  matchResponse,
} from './helpers';
import type Proxy from './proxy';

export default class Handler {
  scope!: Proxy;

  verb!: string;

  path!: string | RegExp;

  params?: object;

  constructor(
    scope: Proxy,
    verb: string,
    path: string | RegExp,
    params?: object,
  ) {
    this.scope = scope;
    this.verb = verb;
    this.path = path;
    this.params = params;
  }

  private setProxy(
    statusCodeOrFunction: number | RouteConfig,
    mock?: unknown,
    once = false,
  ) {
    const interceptorId = this.scope.axios.interceptors.request.use(
      requestConfig => {
        if (matchRequest(this.verb, this.path, requestConfig, this.params)) {
          requestConfig.adapter = config => {
            if (once) ejectFromRequest(this.scope.axios, interceptorId);
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
      },
    );
  }

  private setRequestConfigChanger(
    configChanger: RequestConfigChanger,
    once = false,
  ) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const interceptorId = this.scope.axios.interceptors.request.use(
      async requestConfig => {
        if (matchRequest(verbConfig, pathConfig, requestConfig, paramsConfig)) {
          if (once) ejectFromRequest(this.scope.axios, interceptorId);
          const result = await Promise.resolve(configChanger(requestConfig));
          return result;
        }
        return requestConfig;
      },
    );
  }

  private setPrintableResponse(once = false) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const interceptorId = this.scope.axios.interceptors.response.use(
      response => {
        if (matchResponse(verbConfig, pathConfig, response, paramsConfig)) {
          if (once) ejectFromResponse(this.scope.axios, interceptorId);
          // eslint-disable-next-line no-console
          console.log('Response from:', this.path);
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(response.data, null, 2));
        }
        return response;
      },
    );
  }

  private setChangerResponseData<T>(
    responseChanger: ResponseChanger<T>,
    once = false,
  ) {
    const verbConfig = this.verb;
    const pathConfig = this.path;
    const paramsConfig = this.params;
    const interceptorId = this.scope.axios.interceptors.response.use(
      async (response: AxiosResponse<T>) => {
        if (matchResponse(verbConfig, pathConfig, response, paramsConfig)) {
          if (once) ejectFromResponse(this.scope.axios, interceptorId);
          response.data = await Promise.resolve(responseChanger(response.data));
        }
        return response;
      },
    );
  }

  reply(statusCodeOrConfig: number | RouteConfig, mock?: unknown) {
    this.setProxy(statusCodeOrConfig, mock);
    return this.scope;
  }

  replyOnce(statusCodeOrConfig: number | RouteConfig, mock?: unknown) {
    this.setProxy(statusCodeOrConfig, mock, true);
    return this.scope;
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

  changeResponseData<T>(changer: ResponseChanger<T>) {
    this.setChangerResponseData<T>(changer);
    return this;
  }

  changeResponseDataOnce<T>(changer: ResponseChanger<T>) {
    this.setChangerResponseData<T>(changer, true);
    return this;
  }
}
