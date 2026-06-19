export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'wallet-app-auth-token';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // If the URL is relative, prepend the API_URL
  const finalUrl = url.startsWith('/') ? `${API_URL}${url}` : url;
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Include credentials (cookies) for authentication
  const finalOptions = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
  };

  const res = await fetch(finalUrl, finalOptions);
  return res;
};

export const apiFetcher = (url: string) => apiFetch(url).then((res) => res.json());
