import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

declare global {
  type BaseToMix = new (...args: any[]) => {
    axios: AxiosInstance;
  };

  type RouteConfig = (
    config?: AxiosRequestConfig,
  ) => [number, unknown] | Promise<[number, unknown]>;

  type RequestConfigChanger = (
    config: InternalAxiosRequestConfig,
  ) => InternalAxiosRequestConfig;

  type SetupRequestConfig = {
    axios: AxiosInstance;
    verb: string;
    path: string;
    params?: object;
    once?: boolean;
  };
}
