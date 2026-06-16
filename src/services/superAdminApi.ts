const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://karmyug-apple-backend.onrender.com/api';
const TOKEN_KEY = 'valuxpert_superadmin_token';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object'
        ? payload?.message || payload?.data || payload?.error
        : payload;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return payload?.data ?? payload;
}

export const authStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const superAdminApi = {
  async login(credentials: { email: string; password: string }) {
    const data = await request<{ access_token: string; data: any }>('/super-admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    authStore.setToken(data.access_token);
    return data;
  },

  dashboard: () => request<any>('/super-admin/dashboard'),
  companies: () => request<any[]>('/super-admin/companies'),
  suspendedCompanies: () => request<any[]>('/super-admin/companies/suspended'),
  trashedCompanies: () => request<any[]>('/super-admin/companies/trash'),
  company: (id: string) => request<any>(`/super-admin/companies/${id}`),
  companyUsage: (id: string) => request<any>(`/super-admin/companies/${id}/usage`),
  companyUsers: (id: string, params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<any>(`/super-admin/companies/${id}/users${suffix}`);
  },
  tenantUsers: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<any>(`/super-admin/users${suffix}`);
  },
  companyAuditLogs: (id: string) => request<any[]>(`/super-admin/companies/${id}/audit-logs`),
  companySettings: (id: string) => request<any>(`/super-admin/companies/${id}/settings`),
  auditLogs: () => request<any[]>('/super-admin/audit-logs'),
  billing: () => request<any>('/super-admin/billing'),
  plans: () => request<any[]>('/super-admin/plans'),
  features: () => request<any[]>('/super-admin/features'),

  createCompany: (payload: any) =>
    request<any>('/super-admin/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCompany: (id: string, payload: any) =>
    request<any>(`/super-admin/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  suspendCompany: (id: string) =>
    request<any>(`/super-admin/companies/${id}/suspend`, { method: 'PATCH' }),

  activateCompany: (id: string) =>
    request<any>(`/super-admin/companies/${id}/activate`, { method: 'PATCH' }),

  deleteCompany: (id: string, reason: string) =>
    request<any>(`/super-admin/companies/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  restoreCompany: (id: string) =>
    request<any>(`/super-admin/companies/${id}/restore`, { method: 'PATCH' }),

  updateFeatures: (id: string, features: string[]) =>
    request<any>(`/super-admin/companies/${id}/features`, {
      method: 'PATCH',
      body: JSON.stringify({ features }),
    }),

  updateSubscription: (id: string, payload: any) =>
    request<any>(`/super-admin/companies/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateSettings: (id: string, payload: any) =>
    request<any>(`/super-admin/companies/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  savePlan: (key: string, payload: any) =>
    request<any>(`/super-admin/plans/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
