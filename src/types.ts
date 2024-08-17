import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

export type RouteConfig = (
  config?: AxiosRequestConfig,
) => [number, unknown] | Promise<[number, unknown]>;

export type RequestConfigChanger = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResponseChanger<T = any> = (data: T) => T | Promise<T>;
