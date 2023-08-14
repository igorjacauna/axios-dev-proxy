import { expect, it, describe } from "vitest";
import axios from "axios";
import nock from "nock";
import { defineProxy, defineProxyOnce } from "../src";

const BASE_URL = "https://api.com.br";

function to(promise: Promise<unknown>) {
  return promise
    .then((value) => [undefined, value])
    .catch((error) => [error, undefined]);
}

describe("axios-dev-proxy", () => {
  const api = axios.create({
    baseURL: BASE_URL,
  });

  function execute() {
    return api.get("/test");
  }
  it("should return modified response data once", async () => {
    nock(BASE_URL)
      .get("/test")
      .reply(200, { test: 852 })
      .get("/test")
      .reply(200, { test: 852 });

    defineProxyOnce(
      {
        "/test": {
          data: { test: 100 },
        },
      },
      api,
    );

    let response = await execute();
    expect(response.data).toEqual({ test: 100 });

    response = await execute();
    expect(response.data).toEqual({ test: 852 });
  });

  it("should modified response data always", async () => {
    nock(BASE_URL)
      .get("/test")
      .reply(200, { test: 852 })
      .get("/test")
      .reply(200, { test: 852 });

    const interceptorId = defineProxy(
      {
        "/test": {
          data: { test: 100 },
        },
      },
      api,
    );

    let response = await execute();
    expect(response.data).toEqual({ test: 100 });

    response = await execute();
    expect(response.data).toEqual({ test: 100 });

    // Eject interceptor to prevent breaks next tests
    api.interceptors.response.eject(interceptorId);
  });

  it("should not modified response data for other url", async () => {
    nock(BASE_URL).get("/test").reply(200, { test: 852 });

    defineProxyOnce(
      {
        "/another-test": {
          data: { test: 100 },
        },
      },
      api,
    );

    const response = await execute();
    expect(response.data).toEqual({ test: 852 });
  });

  it("should use function to modified request response", async () => {
    nock(BASE_URL).get("/test").reply(200, { test: 852 });

    defineProxyOnce(
      () => ({
        "/test": {
          data: { test: 100 },
        },
      }),
      api,
    );

    const response = await execute();
    expect(response.data).toEqual({ test: 100 });
  });

  it("should modified only second request response", async () => {
    nock(BASE_URL)
      .get("/test")
      .reply(200, { test: 852 })
      .get("/test")
      .reply(200, { test: 852 });

    let times = 1;
    defineProxyOnce(() => {
      if (times < 2) {
        times += 1;
        return;
      }
      return {
        "/test": {
          data: { test: 100 },
        },
      };
    }, api);

    let response = await execute();
    expect(response.data).toEqual({ test: 852 });

    response = await execute();
    expect(response.data).toEqual({ test: 100 });
  });

  it("should modified response status to error", async () => {
    nock(BASE_URL).get("/test").reply(200, { test: 852 });

    defineProxyOnce(
      {
        "/test": {
          status: 500,
        },
      },
      api,
    );

    const [ex] = await to(execute());
    expect(ex.response?.status).toEqual(500);
  });
});
