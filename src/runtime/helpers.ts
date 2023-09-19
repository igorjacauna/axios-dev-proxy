import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isEqual } from 'ohash';
import { $URL } from 'ufo';

function matchPaths(path: string | RegExp, url: string) {
  if (typeof path === 'string') {
    const requestURL = new $URL(url);
    const matchURL = new $URL(path);
    return requestURL.pathname === matchURL.pathname;
  }
  return path.exec(url);
}

export function hasSameParams(requestParams: object, proxyParams?: object) {
  if (!proxyParams) return true;
  return isEqual(requestParams, proxyParams);
}

// eslint-disable-next-line complexity
export function matchRequest(
  verb: string,
  path: string | RegExp,
  config: AxiosRequestConfig,
  params?: object,
) {
  if (!config.url) return false;
  const samePath = matchPaths(path, config.url);
  const requestURL = new $URL(config.url);

  const sameMethod = config.method === verb;

  if (!sameMethod) return false;
  if (!samePath) return false;

  if (params) return hasSameParams(params, config.params || requestURL.query);

  return true;
}

// eslint-disable-next-line complexity
export function matchResponse(
  verb: string,
  path: string | RegExp,
  response: AxiosResponse,
  params?: object,
) {
  const { config } = response;
  if (!config.url) return false;
  const samePath = matchPaths(path, config.url);
  const requestURL = new $URL(config.url);

  const sameMethod = config.method === verb;

  if (!sameMethod) return false;
  if (!samePath) return false;

  if (params) return hasSameParams(params, config.params || requestURL.query);

  return true;
}

export function ejectFromRequest(axios: AxiosInstance, id: number) {
  axios.interceptors.request.eject(id);
}

export function ejectFromResponse(axios: AxiosInstance, id: number) {
  axios.interceptors.response.eject(id);
}

export function clearAll(axios: AxiosInstance) {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
}
