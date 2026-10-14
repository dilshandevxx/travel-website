// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Typed fetch wrapper used by every frontend
// TODO: Add retries/timeouts and refresh-token handling if needed

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  /** e.g. "http://192.168.1.10:4000/api" */
  baseUrl: string;
  /** Returns the current JWT, if any. */
  getToken?: () => string | null | Promise<string | null>;
}

export interface ApiClient {
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = getToken ? await getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${root}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    const data: unknown = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const message =
        (data as { error?: string } | undefined)?.error ?? `Request failed with ${res.status}`;
      throw new ApiError(res.status, message, data);
    }
    return data as T;
  }

  return {
    request,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
  };
}
