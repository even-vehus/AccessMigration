const BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  customers: {
    list: () => request('/customers'),
    get: (id) => request(`/customers/${id}`),
    create: (data) => request('/customers', { method: 'POST', body: data }),
    update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => request('/products'),
    get: (id) => request(`/products/${id}`),
    create: (data) => request('/products', { method: 'POST', body: data }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: () => request('/orders'),
    get: (id) => request(`/orders/${id}`),
    create: (data) => request('/orders', { method: 'POST', body: data }),
    update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  },
  employees: {
    list: () => request('/employees'),
    get: (id) => request(`/employees/${id}`),
    create: (data) => request('/employees', { method: 'POST', body: data }),
    update: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  },
  orderStatus: {
    list: () => request('/order-status'),
  },
  settings: {
    get: () => request('/settings'),
  },
};
