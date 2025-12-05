const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(endpoint: string): string {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }

  return `${API_BASE_URL}${endpoint}`;
}

export { API_BASE_URL };
