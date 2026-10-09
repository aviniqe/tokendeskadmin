const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const TX_HASH = /^0x[0-9a-fA-F]{64}$/;
const PRIVATE_KEY = /^(0x)?[0-9a-fA-F]{64}$/;
const NUMBER = /^-?\d+(\.\d+)?$/;

export function required(label) {
  return (value) => (String(value ?? '').trim() ? '' : `${label} is required`);
}

export function username() {
  return (value) => {
    const name = String(value ?? '').trim();
    if (!name) return 'Username is required';
    if (name.length < 3 || name.length > 64) return 'Username must be 3 to 64 characters';
    return '';
  };
}

export function password(min = 6) {
  return (value) => {
    const pass = String(value ?? '');
    if (!pass) return 'Password is required';
    if (pass.length < min) return `Password must be at least ${min} characters`;
    return '';
  };
}

export function positiveAmount(label) {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return `${label} is required`;
    if (!NUMBER.test(text)) return `${label} must be a number`;
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount <= 0) return `${label} must be greater than 0`;
    return '';
  };
}

export function nonNegative(label) {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return `${label} is required`;
    if (!NUMBER.test(text)) return `${label} must be a number`;
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount < 0) return `${label} must be zero or greater`;
    return '';
  };
}

export function percentShare() {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return 'Percent is required';
    if (!NUMBER.test(text)) return 'Percent must be a number';
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
      return 'Percent must be greater than 0 and at most 100';
    }
    return '';
  };
}

export function percentRange(label) {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return `${label} is required`;
    if (!NUMBER.test(text)) return `${label} must be a number`;
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100) return `${label} must be from 0 to 100`;
    return '';
  };
}

export function ethAddress(label, { optional = false } = {}) {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return optional ? '' : `${label} is required`;
    if (!ADDRESS.test(text)) return `${label} must be a 0x address`;
    return '';
  };
}

export function txHash() {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return 'Transaction hash is required';
    if (!TX_HASH.test(text)) return 'Transaction hash must be a 0x hash';
    return '';
  };
}

export function httpUrl(label) {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return `${label} is required`;
    if (!/^https?:\/\//i.test(text)) return `${label} must start with http:// or https://`;
    try {
      const url = new URL(text);
      if (!url.hostname) return `${label} is not a valid URL`;
    } catch {
      return `${label} is not a valid URL`;
    }
    return '';
  };
}

export function chainId() {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return 'Choose a chain';
    if (!/^\d+$/.test(text) || Number(text) <= 0) return 'Chain id must be a whole number';
    return '';
  };
}

export function privateKey() {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return '';
    if (!PRIVATE_KEY.test(text)) return 'Gas funder private key is invalid';
    return '';
  };
}

export function payoutLabel() {
  return (value) => {
    const text = String(value ?? '').trim();
    if (!text) return 'Label is required';
    if (text.length > 80) return 'Label must be 80 characters or fewer';
    return '';
  };
}

export function collect(rules, values) {
  const errors = {};
  Object.entries(rules).forEach(([name, rule]) => {
    const message = rule(values[name], values);
    if (message) errors[name] = message;
  });
  return errors;
}
