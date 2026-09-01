const getBaseUrl = (): string => {
  let envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (envUrl.endsWith('/api')) {
    envUrl = envUrl.slice(0, -4);
  }
  return envUrl;
};

const buildUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
  return `${baseUrl}${apiPath}`;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('pms_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/session-expired';
    }
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error: any = new Error(data?.message || `Request failed with status ${res.status}`);
    error.response = { status: res.status, data };
    throw error;
  }
  return { data, status: res.status };
};

export const apiClient = {
  get: async <T = any>(url: string, config?: { params?: Record<string, any> }): Promise<{ data: T; status: number }> => {
    let fullUrl = buildUrl(url);
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
    }
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  post: async <T = any>(url: string, body?: any): Promise<{ data: T; status: number }> => {
    const res = await fetch(buildUrl(url), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  put: async <T = any>(url: string, body?: any): Promise<{ data: T; status: number }> => {
    const res = await fetch(buildUrl(url), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  delete: async <T = any>(url: string): Promise<{ data: T; status: number }> => {
    const res = await fetch(buildUrl(url), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export default apiClient;
