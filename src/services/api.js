const API = process.env.REACT_APP_API_URL || 'http://localhost:5741/api';
const TOKEN_KEY = 'tokendesk_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) setToken('');
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function login(username, password) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function me() {
  return request('/admin/me');
}

export function getPayoutWallets() {
  return request('/admin/payout-wallets');
}

export function createPayoutWallet(body) {
  return request('/admin/payout-wallets', { method: 'POST', body: JSON.stringify(body) });
}

export function updatePayoutWallet(id, body) {
  return request(`/admin/payout-wallets/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deletePayoutWallet(id) {
  return request(`/admin/payout-wallets/${id}`, { method: 'DELETE' });
}

export function getDeposits() {
  return request('/admin/deposits');
}

export function retryDeposit(id) {
  return request(`/admin/deposits/${id}/retry`, { method: 'POST', body: '{}' });
}
