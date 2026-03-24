declare module 'axios' {
  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: unknown;
  }

  export interface AxiosError<T = unknown> extends Error {
    config?: unknown;
    code?: string;
    request?: unknown;
    response?: AxiosResponse<T>;
  }

  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: unknown): Promise<AxiosResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<AxiosResponse<T>>;
    put<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<AxiosResponse<T>>;
    delete<T = unknown>(url: string, config?: unknown): Promise<AxiosResponse<T>>;
    request<T = unknown>(config: unknown): Promise<AxiosResponse<T>>;
  }

  const axios: AxiosInstance & {
    create(config?: unknown): AxiosInstance;
  };

  export default axios;
}
