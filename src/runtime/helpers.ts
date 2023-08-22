import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isEqual } from 'ohash';

export function hasSameParams(requestParams: object, proxyParams?: object) {
  if (!proxyParams) return true;
  return isEqual(requestParams, proxyParams);
}

export function matchRequest(
  verb: string,
  path: string,
  config: AxiosRequestConfig,
  params?: object,
) {
  return (
    config.method === verb &&
    config.url === path &&
    hasSameParams(config.params, params)
  );
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
