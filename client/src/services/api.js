const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

export const dashboard = {
  summary: () => request('/dashboard/summary'),
  lowStock: () => request('/dashboard/low-stock'),
  recentMovements: () => request('/dashboard/recent-movements'),
};

export const inventory = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/inventory/${id}`),
  create: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
  alerts: () => request('/inventory/alerts'),
};

export const stock = {
  update: (itemId, data) => request(`/stock/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  move: (itemId, data) => request(`/stock/${itemId}/move`, { method: 'POST', body: JSON.stringify(data) }),
  receive: (itemId, data) => request(`/stock/${itemId}/receive`, { method: 'POST', body: JSON.stringify(data) }),
  movements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/stock/movements${qs ? `?${qs}` : ''}`);
  },
};

export const categories = {
  list: () => request('/categories'),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
};

export const menu = {
  list: () => request('/menu'),
  get: (id) => request(`/menu/${id}`),
  create: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const vendors = {
  list: () => request('/vendors'),
  get: (id) => request(`/vendors/${id}`),
  create: (data) => request('/vendors', { method: 'POST', body: JSON.stringify(data) }),
};

export const purchaseOrders = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/purchase-orders${qs ? `?${qs}` : ''}`);
  },
  create: (data) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  receive: (id, items) => request(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify({ items }) }),
};
