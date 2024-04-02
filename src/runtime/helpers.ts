import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isEqual } from 'ohash';
import { parseURL, parseQuery } from 'ufo';

function matchPaths(pathToMatch: string | RegExp, url: string) {
  if (typeof pathToMatch === 'string') {
    const requestURL = parseURL(url);
    const matchURL = parseURL(pathToMatch);
    return requestURL.pathname === matchURL.pathname;
  }
  return pathToMatch.exec(url);
}

export function hasSameParams(paramsToMatch: object, requestParams?: object) {
  return isEqual(paramsToMatch, requestParams);
}

// eslint-disable-next-line complexity
export function matchRequest(
  verbToMatch: string,
  pathToMatch: string | RegExp,
  config: AxiosRequestConfig,
  paramsToMatch?: object,
) {
  if (!config.url) return false;
  const samePath = matchPaths(pathToMatch, config.url);
  const requestURL = parseURL(config.url);

  const sameMethod = config.method === verbToMatch;

  if (!sameMethod) return false;
  if (!samePath) return false;

  const searchParams = parseQuery(requestURL.search || '');

  if (paramsToMatch)
    return hasSameParams(paramsToMatch, config.params || searchParams);

  return true;
}

// eslint-disable-next-line complexity
export function matchResponse(
  verbToMatch: string,
  pathToMatch: string | RegExp,
  response: AxiosResponse,
  paramsToMatch?: object,
) {
  const { config } = response;
  if (!config.url) return false;
  const samePath = matchPaths(pathToMatch, config.url);
  const requestURL = parseURL(config.url);

  const sameMethod = config.method === verbToMatch;

  if (!sameMethod) return false;
  if (!samePath) return false;

  const searchParams = parseQuery(requestURL.search || '');

  if (paramsToMatch)
    return hasSameParams(paramsToMatch, config.params || searchParams);

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
