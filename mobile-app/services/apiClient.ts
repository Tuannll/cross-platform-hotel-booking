import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';

type ApiErrorBody = {
  message?: string | string[];
};

type RefreshTokens = {
  accessToken: string;
  refreshToken?: string;
};

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

let refreshPromise: Promise<string> | null = null;

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          refreshPromise ??= client
            .post<RefreshTokens>('/auth/refresh', { refreshToken })
            .then(async ({ data }) => {
              await SecureStore.setItemAsync('access_token', data.accessToken);
              if (data.refreshToken) {
                await SecureStore.setItemAsync('refresh_token', data.refreshToken);
              }
              return data.accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });

          originalRequest.headers.Authorization = `Bearer ${await refreshPromise}`;
          return client(originalRequest);
        } catch {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
        }
      }

      return Promise.reject(new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.'));
    }

    const message = error.response?.data.message;
    return Promise.reject(
      new Error(
        Array.isArray(message)
          ? message[0]
          : message || 'Lỗi kết nối máy chủ',
      ),
    );
  },
);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return (await client.request<T>(config)).data;
}

const apiClient = {
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'DELETE', url }),
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'GET', url }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, data, method: 'PATCH', url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, data, method: 'POST', url }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, data, method: 'PUT', url }),
};

export default apiClient;
