import type { ApiResponse } from '@ai-gym/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const data = (await response.json()) as ApiResponse<T>;
  return data;
}
