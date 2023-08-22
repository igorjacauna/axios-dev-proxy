import { type AxiosInstance } from 'axios';
import Proxy from './runtime/proxy';

export function defineProxy(apiInstance: AxiosInstance) {
  return new Proxy(apiInstance);
}
