import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

export type RouteConfig = (
  config?: AxiosRequestConfig,
) => [number, unknown] | Promise<[number, unknown]>;

export type RequestConfigChanger = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig;
