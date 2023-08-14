import { AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { withLeadingSlash } from "ufo";

type ProxyConfig = {
  [route: string]: {
    data?: object;
    status?: number;
  };
};

type ProxyConfigFn = (
  response?: AxiosResponse,
) => ProxyConfig | undefined | null;

export type DevProxyConfig = ProxyConfig | ProxyConfigFn;

function addLeadingSlashToProxyRoutes(routes: ProxyConfig) {
  const entries = Object.entries(routes);
  const routesWithLeadingSlash = entries.map(([route, data]) => [
    withLeadingSlash(route),
    data,
  ]);
  return Object.fromEntries(routesWithLeadingSlash);
}

function getRoutes(config: DevProxyConfig, response: AxiosResponse) {
  if (typeof config === "function") {
    const routes = addLeadingSlashToProxyRoutes(config(response) || {});
    return routes;
  }
  return config;
}

export function defineProxy(
  config: DevProxyConfig,
  apiInstance: AxiosInstance,
  once = false,
) {
  const interceptorId = apiInstance.interceptors.response.use((response) => {
    const routes = getRoutes(config, response);
    const paths = Object.keys(routes);
    const {
      data: originalData,
      config: { url },
    } = response;

    const urlWithLeadingSlash = withLeadingSlash(url || "");

    if (paths.includes(urlWithLeadingSlash)) {
      if (once) {
        apiInstance.interceptors.response.eject(interceptorId);
      }

      const proxyRouteConfig = routes[urlWithLeadingSlash];
      const data = { ...originalData, ...proxyRouteConfig.data };
      const status = proxyRouteConfig.status || response.status;

      console.log(
        "Development Proxy on:",
        urlWithLeadingSlash,
        "\n",
        JSON.stringify(proxyRouteConfig, undefined, 2),
      );

      if (status < 400) {
        return { ...response, data, status };
      }

      const { statusText, request } = response;

      return Promise.reject(
        new AxiosError(statusText, String(status), response.config, request, {
          ...response,
          data,
          status,
        }),
      );
    }
    return response;
  });
  return interceptorId;
}

export function defineProxyOnce(
  config: DevProxyConfig,
  apiInstance: AxiosInstance,
) {
  return defineProxy(config, apiInstance, true);
}
