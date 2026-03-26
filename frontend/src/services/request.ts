import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { token } from '../utils/token';

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const t = token.get();
    if (t && config.headers) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Token 过期或无效，清除并跳转登录
        token.remove();
        window.location.href = '/admin/login';
      } else if (status === 403) {
        console.error('权限不足');
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default request;
