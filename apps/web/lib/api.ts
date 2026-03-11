import type { ApiResponse } from './shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function unexpectedResponseError(status: number): ApiResponse<never> {
  return {
    success: false,
    error:
      status >= 500
        ? 'The server is temporarily unavailable. Please try again shortly.'
        : `Request failed with status ${status}.`,
  };
}

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

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch {
    return {
      success: false,
      error:
        'Unable to reach the API. Check the deployment URL or local API server.',
    };
  }

  const rawBody = await response.text();

  if (!rawBody) {
    return response.ok
      ? {
          success: false,
          error: 'The server returned an empty response.',
        }
      : unexpectedResponseError(response.status);
  }

  try {
    return JSON.parse(rawBody) as ApiResponse<T>;
  } catch {
    return unexpectedResponseError(response.status);
  }
}
