import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isEqual } from 'ohash';
import { $URL } from 'ufo';

export function hasSameParams(requestParams: object, proxyParams?: object) {
  if (!proxyParams) return true;
  return isEqual(requestParams, proxyParams);
}

// eslint-disable-next-line complexity
export function matchRequest(
  verb: string,
  path: string,
  config: AxiosRequestConfig,
  params?: object,
) {
  const requestURL = new $URL(config.url);
  const matchURL = new $URL(path);

  const sameMethod = config.method === verb;
  const samePath = requestURL.pathname === matchURL.pathname;

  if (!sameMethod) return false;
  if (!samePath) return false;

  if (params) return hasSameParams(params, config.params || requestURL.query);

  return true;
}

export function matchResponse(
  verb: string,
  path: string,
  response: AxiosResponse,
  params?: object,
) {
  return (
    response.config.method === verb &&
    response.config.url === path &&
    hasSameParams(response.config.params, params)
  );
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
