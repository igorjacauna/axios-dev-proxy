import axios from 'axios';
import nock from 'nock';
import { expect, it, describe, beforeEach } from 'vitest';
import { defineProxy } from '../src';

const BASE_URL = 'https://api.com.br';

function to(promise: Promise<unknown>) {
  return promise
    .then(value => [undefined, value])
    .catch(error => [error, undefined]);
}

describe('axios-dev-proxy tests', () => {
  const server = nock(BASE_URL);

  describe('once configs', () => {
    const api = axios.create({
      baseURL: BASE_URL,
    });

    beforeEach(() => {
      server.removeAllListeners();
    });

    const proxy = defineProxy(api);

    it('should not modify response when no route configured', async () => {
      server.get('/').reply(200, { data: 1 });
      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
    });

    it('should modify response once', async () => {
      server.get('/').reply(200, { data: 1 }).get('/').reply(200, { data: 1 });

      proxy.onceGet('/').reply(201, {
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
        .onceGet('/')
        .reply(201, {
          data: 2,
        })
        .onceGet('/')
        .reply(201, {
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

      proxy.onceGet('/2').reply(201, {
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

      proxy.onceGet('/').reply(200, {
        data: 1,
      });

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
      expect(response.status).toEqual(200);
    });

    it('should modify response to error', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onceGet('/').reply(400, {
        data: 1,
      });

      const [error, response] = await to(api.get('/'));
      expect(response).toEqual(undefined);
      expect(error).not.toEqual(undefined);
    });

    it('should modify response with function', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onceGet('/').reply(() => [201, { data: 2 }]);

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);
    });

    it('should modify only specific verb response', async () => {
      server
        .get('/')
        .reply(200, { data: 1 })
        .post('/')
        .reply(200, { data: 'post' });

      proxy.onceGet('/').reply(() => [201, { data: 2 }]);

      const responsePost = await api.post('/');
      expect(responsePost.data).toEqual({ data: 'post' });
      expect(responsePost.status).toEqual(200);

      const responseGet = await api.get('/');
      expect(responseGet.data).toEqual({ data: 2 });
      expect(responseGet.status).toEqual(201);
    });

    it('should modify response with query params', async () => {
      server.get('/').reply(200, { data: 1 });

      proxy.onceGet('/').reply(201, {
        data: 2,
      });

      const response = await api.get('/', { params: { q: '2' } });
      expect(response.data).toEqual({ data: 2 });
      expect(response.status).toEqual(201);
    });

    it('should modify response for route with specific query params', async () => {
      server.get('/').reply(200, { data: 1 }).get('/').reply(200, { data: 2 });

      proxy.onceGet('/', { q: 'param' }).reply(201, {
        data: 2,
      });

      const response = await api.get('/');
      expect(response.data).toEqual({ data: 1 });
      expect(response.status).toEqual(200);

      const response2 = await api.get('/', { params: { q: 'param' } });
      expect(response2.data).toEqual({ data: 2 });
      expect(response2.status).toEqual(201);
    });
  });

  describe('always configs', () => {
    const api = axios.create({
      baseURL: BASE_URL,
    });

    beforeEach(() => {
      server.removeAllListeners();
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
});
