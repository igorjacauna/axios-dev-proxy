/* eslint-disable max-lines */
import axios from 'axios';
import nock from 'nock';
import { expect, it, describe, beforeEach, vi } from 'vitest';
import { defineProxy } from '../src';

const BASE_URL = 'https://api.com.br';
async function to(promise: Promise<unknown>) {
  try {
    const value = await promise;
    return [undefined, value];
  } catch (error) {
    return [error, undefined];
  }
}

describe('axios-dev-proxy tests', () => {
  const server = nock(BASE_URL);

  describe('once GET configs', () => {
    const api = axios.create({
      baseURL: BASE_URL,
    });
    beforeEach(() => {
      nock.cleanAll();
    });
    const proxy = defineProxy(api);

    it('should not modify response when no route configured', async () => {
      server.get('/').reply(200, { data: 1 });
      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
    });

    it('should modify response once', async () => {
      server.get('/').reply(200, { data: 1 }).get('/').reply(200, { data: 1 });

      proxy.onGet('/').replyOnce(201, {
        data: 2,
      });
      const response = await api.get('/');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);

      const response2 = await api.get('/');
      expect(response2.data).toEqual({ data: 1 });
      expect(response2.status).toEqual(200);
    });

    it('should modify response twice', async () => {
      server
        .get('/')
        .reply(200, { data: 1 })
        .get('/')
        .reply(200, { data: 1 })
        .get('/')
        .reply(200, { data: 1 });

      proxy
        .onGet('/')
        .replyOnce(201, {
          data: 2,
        })
        .onGet('/')
        .replyOnce(201, {
          data: 2,
        });

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);

      const response2 = await api.get('/');
      expect(response2.data).toEqual({ data: 2 });
      expect(response2.status).toEqual(201);

      const response3 = await api.get('/');
      expect(response3.data).toEqual({ data: 1 });
      expect(response3.status).toEqual(200);
    });

    it('should modify response for only configured path', async () => {
      server.get('/').reply(200, { data: 1 }).get('/2').reply(200, { data: 2 });

      proxy.onGet('/2').replyOnce(201, {
        data: 22,
      });

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
      expect(response.status).toEqual(200);

      const response2 = await api.get('/2');
      expect(response2.data).toEqual({ data: 22 });
      expect(response2.status).toEqual(201);
    });

    it('should modify response even in failure request', async () => {
      server.get('/').reply(400, { data: 0 });

      proxy.onGet('/').replyOnce(200, {
        data: 1,
      });

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
      expect(response.status).toEqual(200);
    });

    it('should modify response to error', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onGet('/').replyOnce(400, {
        data: 1,
      });

      const [error, response] = await to(api.get('/'));
      expect(response).toEqual(undefined);
      expect(error).not.toEqual(undefined);
    });

    it('should modify response with function', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onGet('/').replyOnce(() => [201, { data: 2 }]);

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);
    });

    it('should modify response with function returning error', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onGet('/').replyOnce(() => [400, { data: 2 }]);

      const [error, response] = await to(api.get('/'));
      expect(response).toEqual(undefined);
      expect(error).not.toEqual(undefined);
    });

    it('should modify only specific verb response', async () => {
      server
        .get('/')
        .reply(200, { data: 1 })
        .post('/')
        .reply(200, { data: 'post' });

      proxy.onGet('/').replyOnce(() => [201, { data: 2 }]);

      const responsePost = await api.post('/');
      expect(responsePost.data).toEqual({ data: 'post' });
      expect(responsePost.status).toEqual(200);

      const responseGet = await api.get('/');
      expect(responseGet.data).toEqual({ data: 2 });
      expect(responseGet.status).toEqual(201);
    });

    it('should modify response with query params in config', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onGet('/').replyOnce(201, {
        data: 2,
      });

      const response = await api.get('/', { params: { q: '2' } });
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);
    });

    it('should modify response with query params in path', async () => {
      server.get('/?q=2').reply(200, { data: 1 });

      proxy.onGet('/').replyOnce(201, {
        data: 2,
      });

      const response = await api.get('/?q=2');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);
    });

    it('should modify response for route with specific query params in options', async () => {
      server.get('/').reply(200, { data: 1 }).get('/').reply(200, { data: 1 });

      proxy.onGet('/', { q: 'param' }).replyOnce(201, {
        data: 2,
      });

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
      expect(response.status).toEqual(200);

      const response2 = await api.get('/', { params: { q: 'param' } });
      expect(response2.data).toEqual({ data: 2 });
      expect(response2.status).toEqual(201);
    });

    it('should modify response for route with specific query params in path', async () => {
      server
        .get('/?q=param')
        .reply(200, { data: 1 })
        .get('/?q=param2')
        .reply(200, { data: 1 });

      proxy.onGet('/', { q: 'param2' }).replyOnce(201, {
        data: 2,
      });

      const response = await api.get('/?q=param');
      expect(response.data).toEqual({ data: 1 });
      expect(response.status).toEqual(200);

      const response2 = await api.get('/?q=param2');
      expect(response2.data).toEqual({ data: 2 });
      expect(response2.status).toEqual(201);
    });

    it('should modify response for regex route', async () => {
      server.get('/test/2?q=2').reply(200, { data: 1 });

      proxy.onGet(/\/test\/\d+/).replyOnce(201, {
        data: 2,
      });
      const response = await api.get('/test/2?q=2');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);
    });
  });

  describe('always GET configs', () => {
    const api = axios.create({
      baseURL: BASE_URL,
    });
    beforeEach(() => {
      nock.cleanAll();
    });
    const proxy = defineProxy(api);

    it('should not modify response when no route configured', async () => {
      server.get('/').reply(200, { data: 1 });
      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
    });

    it('should modify response always', async () => {
      server.get('/').reply(200, { data: 1 }).get('/').reply(200, { data: 1 });

      proxy.onGet('/').reply(201, {
        data: 2,
      });
      const response = await api.get('/');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);

      const response2 = await api.get('/');
      expect(response2.data).toEqual({ data: 2 });
      expect(response2.status).toEqual(201);
    });
  });

  describe('other verbs', () => {
    const api = axios.create({
      baseURL: BASE_URL,
    });

    beforeEach(() => {
      nock.cleanAll();
    });

    const proxy = defineProxy(api);

    it('should modify response', async () => {
      server
        .post('/')
        .reply(200, { data: 1 })
        .put('/')
        .reply(200, { data: 1 })
        .patch('/')
        .reply(200, { data: 1 });

      proxy
        .onPost('/')
        .replyOnce(201, {
          data: 2,
        })
        .onPut('/')
        .replyOnce(201, {
          data: 3,
        })
        .onPatch('/')
        .replyOnce(201, {
          data: 4,
        });
      const response = await api.post('/');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);

      const response2 = await api.put('/');
      expect(response2.data).toEqual({ data: 3 });
      expect(response2.status).toEqual(201);

      const response3 = await api.patch('/');
      expect(response3.data).toEqual({ data: 4 });
      expect(response3.status).toEqual(201);
    });
  });

  describe('other actions', () => {
    const api = axios.create({
      baseURL: BASE_URL,
    });
    const proxy = defineProxy(api);

    beforeEach(() => {
      nock.cleanAll();
      proxy.clear();
    });

    it('should print response', async () => {
      server
        .get('/print-response')
        .reply(200, { data: 1 })
        .get('/print-response')
        .reply(200, { data: 2 });
      const consoleLog = vi.spyOn(console, 'log');

      proxy.onGet('/print-response').printResponse();

      await api.get('/print-response');
      await api.get('/print-response');

      expect(consoleLog).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({ data: 1 }, null, 2),
      );
    });

    it('should print response once', async () => {
      server
        .get('/print-response')
        .reply(200, { data: 1 })
        .get('/print-response')
        .reply(200, { data: 2 });
      const consoleLog = vi.spyOn(console, 'log');
      proxy.onGet('/print-response').printResponseOnce();

      await api.get('/print-response');
      await api.get('/print-response');

      expect(consoleLog).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({ data: 1 }, null, 2),
      );
      expect(consoleLog).toBeCalledTimes(2);
    });

    it('should print response once with regex on match', async () => {
      server
        .get('/print-response')
        .reply(200, { data: 1 })
        .get('/print-response')
        .reply(200, { data: 2 });
      const consoleLog = vi.spyOn(console, 'log');
      proxy.onGet(/\/print-\w+/).printResponseOnce();

      await api.get('/print-response');
      await api.get('/print-response');

      expect(consoleLog).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({ data: 1 }, null, 2),
      );
      expect(consoleLog).toBeCalledTimes(2);
    });

    it('should change the request config', async () => {
      const server2 = nock('https://api-2.com.br');
      server2.get('/config').reply(200, { data: 2 });
      server.get('/config').reply(200, { data: 1 });
      proxy.onGet('/config').changeRequest(config => {
        config.baseURL = 'https://api-2.com.br';
        return config;
      });

      await api.get('/config');

      expect(server.isDone()).toBe(false);
      expect(server.pendingMocks()).toHaveLength(1);
      expect(server2.isDone()).toBe(true);
    });

    it('should change the request config once', async () => {
      const server2 = nock('https://api-2.com.br');
      server2.get('/config').reply(200, { data: 2 });
      server.get('/config').reply(200, { data: 1 });
      proxy.onGet('/config').changeRequestOnce(config => {
        config.baseURL = 'https://api-2.com.br';
        return config;
      });

      await api.get('/config');
      await api.get('/config');

      expect(server.isDone()).toBe(true);
      expect(server2.isDone()).toBe(true);
    });

    it('should change the request config for one path', async () => {
      const server2 = nock('https://api-2.com.br');
      server2
        .get('/config')
        .reply(200, { data: 2 })
        .get('/config-2')
        .reply(200, { data: 2 });
      server
        .get('/config')
        .reply(200, { data: 1 })
        .get('/config-2')
        .reply(200, { data: 2 });

      proxy.onGet('/config').changeRequest(config => {
        config.baseURL = 'https://api-2.com.br';
        return config;
      });

      await api.get('/config');
      await api.get('/config-2');

      expect(server.pendingMocks()).toHaveLength(1);
      expect(server2.pendingMocks()).toHaveLength(1);
    });
  });
});
