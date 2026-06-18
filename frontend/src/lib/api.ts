export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // If the URL is relative, prepend the API_URL
  const finalUrl = url.startsWith('/') ? `${API_URL}${url}` : url;
  
  // Include credentials (cookies) for authentication
  const finalOptions = {
    ...options,
    credentials: 'include' as RequestCredentials,
  };

  const res = await fetch(finalUrl, finalOptions);
  return res;
};

export const apiFetcher = (url: string) => apiFetch(url).then((res) => res.json());
