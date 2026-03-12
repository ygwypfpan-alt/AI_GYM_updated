import type { ApiResponse } from './shared';
import { PUBLIC_API_BASE_URL } from './public-env';

const API_BASE_URL = PUBLIC_API_BASE_URL;

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const data = (await response.json()) as ApiResponse<T>;
  return data;
}
