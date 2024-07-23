# axios-dev-proxy

Simple proxy to mock request for easy development of frontend with axios.

## Usage

Install package:

```sh
# npm
npm install -D axios-dev-proxy

# yarn
yarn add -D axios-dev-proxy

# pnpm
pnpm install -D axios-dev-proxy
```

Import:

```js
// ESM
import { defineProxy } from "axios-dev-proxy";

// CommonJS
const { defineProxy } = require("axios-dev-proxy");

const proxy = defineProxy(axiosInstance);

// Simple use
proxy.onGet('/path-to-mock').reply(200, {
  xpto: 'data to response'
});

// Use a function to return array like [status, response]
proxy.onGet('/path-to-mock').reply(() => {
  return [200, { xpto: 'data to response' }]
});

// To mock only once, next requests will not be mocked
proxy.onGet('/path-to-mock-once').replyOnce(200, {
  xpto: 'data to response once'
});

// To mock for specific route with specific params
// Get /path-to-mock?q="value"
proxy.onGet('/path-to-mock', { q: 'value' }).reply(200, {
  xpto: 'data to response once'
});

// Can change the AxiosRequestConfig
proxy.onGet('/path-to-request').changeRequest((requestConfig) => {
  requestConfig.baseURL = 'http://another.api';
  return requestConfig;
});

// Can change original response data
proxy.onGet('/').changeResponseData(originalData => ({
  ...originalData,
  override: 'another value',
}));

proxy.onGet('/').changeResponseDataOnce(originalData => ({
  ...originalData,
  override: 'another value once',
}));

// Or just want to see the response change the AxiosRequestConfig
proxy.onGet('/path-to-request').printResponse();

// You can chain
proxy.onGet('/path')
  // Change the base URL for '/path' requests
  .changeRequest((requestConfig) => {
    requestConfig.baseURL = 'http://another.api';
    return requestConfig;
  })
  // Print the response for '/path' requests
  .printResponse()
  // On first '/another-path' request only
  .onGet('/another-path')
  // Reply once with
  .replyOnce({
    xpto: 'lorem ipsum'
  });
```

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `yarn install`
- Run interactive tests using `yarn dev`

## License

Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/axios-dev-proxy?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/axios-dev-proxy
[npm-downloads-src]: https://img.shields.io/npm/dm/axios-dev-proxy?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/axios-dev-proxy
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/axios-dev-proxy/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/unjs/axios-dev-proxy
[bundle-src]: https://img.shields.io/bundlephobia/minzip/axios-dev-proxy?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=axios-dev-proxy
[license-src]: https://img.shields.io/github/license/unjs/axios-dev-proxy.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/unjs/axios-dev-proxy/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsDocs.io-reference-18181B?style=flat&colorA=18181B&colorB=F0DB4F
[jsdocs-href]: https://www.jsdocs.io/package/axios-dev-proxy
