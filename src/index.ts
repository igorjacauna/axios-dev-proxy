import { type AxiosInstance } from 'axios';
import Proxy from './runtime/proxy';

export function defineProxy(apiInstance: AxiosInstance, generateDocs = false) {
  return new Proxy(apiInstance, generateDocs);
}
