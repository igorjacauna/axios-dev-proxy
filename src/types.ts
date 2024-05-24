import type {
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

export type RouteConfig = (
  config?: AxiosRequestConfig,
) => [number, unknown] | Promise<[number, unknown]>;

export type RequestConfigChanger = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig;

export type ResponseChanger = (response: AxiosResponse) => AxiosResponse;
