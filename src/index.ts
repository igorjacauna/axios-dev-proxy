import { type AxiosInstance } from 'axios';
import Adapter from './runtime/adapter';

export function defineProxy(apiInstance: AxiosInstance) {
  return new Adapter(apiInstance);
}
