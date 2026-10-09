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
  if (response.status === 401 && !path.endsWith('/login')) setToken('');
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function login(username, password) {
  return request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function me() {
  return request('/admin/me');
}

export function changePassword(currentPassword, password) {
  return request('/admin/password', { method: 'PUT', body: JSON.stringify({ currentPassword, password }) });
}

export function getUsers() {
  return request('/admin/users');
}

export function createUser(body) {
  return request('/admin/users', { method: 'POST', body: JSON.stringify(body) });
}

export function setUserPassword(id, password) {
  return request(`/admin/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
}

export function setUserStatus(id, active) {
  return request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ active }) });
}

export function adjustUserWallet(id, body) {
  return request(`/admin/users/${id}/wallet`, { method: 'POST', body: JSON.stringify(body) });
}

export function getTopups() {
  return request('/admin/topups');
}

export function reviewTopup(id, body) {
  return request(`/admin/topups/${id}/review`, { method: 'POST', body: JSON.stringify(body) });
}

export function getHotWallets() {
  return request('/admin/hot-wallets');
}

export function createHotWallet() {
  return request('/admin/hot-wallets', { method: 'POST', body: '{}' });
}

export function revealHotWallet(id) {
  return request(`/admin/hot-wallets/${id}/secret`);
}

export function transferBnb(id, body) {
  return request(`/admin/hot-wallets/${id}/transfer-bnb`, { method: 'POST', body: JSON.stringify(body) });
}

export function transferUsdt(id, body) {
  return request(`/admin/hot-wallets/${id}/transfer-usdt`, { method: 'POST', body: JSON.stringify(body) });
}

export function setHotWalletDisabled(id, disabled) {
  return request(`/admin/hot-wallets/${id}/disabled`, { method: 'POST', body: JSON.stringify({ disabled }) });
}

export function getDeposits() {
  return request('/admin/deposits');
}

export function retryDeposit(id) {
  return request(`/admin/deposits/${id}/retry`, { method: 'POST', body: '{}' });
}

export function getSettings() {
  return request('/admin/settings');
}

export function saveSettings(body) {
  return request('/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
}
