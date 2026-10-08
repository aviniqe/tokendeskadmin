import { useEffect, useState } from 'react';
import {
  createPayoutWallet,
  deletePayoutWallet,
  getDeposits,
  getPayoutWallets,
  getToken,
  login,
  me,
  retryDeposit,
  setToken,
  updatePayoutWallet,
} from './services/api';
import './App.css';

const emptyForm = { label: '', address: '', percent: '', active: true };

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('payouts');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    me()
      .then((data) => setAdmin(data.admin))
      .catch(() => setToken(''))
      .finally(() => setReady(true));
  }, []);

  async function onLogin(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await login(username, password);
      setToken(data.token);
      setAdmin(data.admin);
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!ready) return <main className="admin"><p>Loading…</p></main>;

  if (!admin) {
    return (
      <main className="admin admin--login">
        <form className="panel" onSubmit={onLogin}>
          <p className="kicker">Token Desk</p>
          <h1>Admin sign in</h1>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Sign in</button>
        </form>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside>
        <strong>Token Desk</strong>
        <button type="button" className={page === 'payouts' ? 'is-on' : ''} onClick={() => setPage('payouts')}>Payout wallets</button>
        <button type="button" className={page === 'deposits' ? 'is-on' : ''} onClick={() => setPage('deposits')}>Deposits</button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setToken('');
            setAdmin(null);
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="admin">
        {page === 'payouts' ? <Payouts /> : <Deposits />}
      </main>
    </div>
  );
}

function Payouts() {
  const [wallets, setWallets] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const data = await getPayoutWallets();
    setWallets(data.wallets);
    setTotal(data.totalPercent);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    const body = {
      label: form.label,
      address: form.address,
      percent: Number(form.percent),
      active: form.active,
    };
    try {
      if (editing) await updatePayoutWallet(editing, body);
      else await createPayoutWallet(body);
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <header className="head">
        <div>
          <h1>Payout wallets</h1>
          <p>Active wallets must total 100%. The last wallet receives any rounding remainder.</p>
        </div>
        <span className={Math.abs(total - 100) < 0.0001 ? 'ok' : 'warn'}>{total}% active</span>
      </header>
      <form className="panel grid" onSubmit={onSubmit}>
        <label>
          Label
          <input value={form.label} onChange={(event) => setField('label', event.target.value)} required />
        </label>
        <label>
          Address
          <input value={form.address} onChange={(event) => setField('address', event.target.value)} required />
        </label>
        <label>
          Percent
          <input type="number" min="0.0001" max="100" step="0.0001" value={form.percent} onChange={(event) => setField('percent', event.target.value)} required />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.active} onChange={(event) => setField('active', event.target.checked)} />
          Active
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit">{editing ? 'Save wallet' : 'Add wallet'}</button>
          {editing && (
            <button type="button" className="ghost" onClick={() => { setEditing(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Address</th>
              <th>Percent</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet) => (
              <tr key={wallet.id}>
                <td>{wallet.label}</td>
                <td className="mono">{wallet.address}</td>
                <td>{wallet.percent}%</td>
                <td>{wallet.active ? 'Yes' : 'No'}</td>
                <td className="actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(wallet.id);
                      setForm({
                        label: wallet.label,
                        address: wallet.address,
                        percent: String(wallet.percent),
                        active: Boolean(wallet.active),
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={async () => {
                      await deletePayoutWallet(wallet.id);
                      await load();
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Deposits() {
  const [deposits, setDeposits] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const data = await getDeposits();
    setDeposits(data.deposits);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    const timer = setInterval(() => {
      load().catch((err) => setError(err.message));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section>
      <header className="head">
        <div>
          <h1>Deposits</h1>
          <p>Each address receives USDT and sends the split itself.</p>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Status</th>
              <th>Received</th>
              <th>Payouts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id}>
                <td className="mono">{deposit.address}</td>
                <td>
                  {deposit.status}
                  {deposit.errorMessage && <div className="error">{deposit.errorMessage}</div>}
                </td>
                <td>{deposit.receivedAmount}</td>
                <td>
                  {deposit.payouts.map((payout) => (
                    <div key={payout.id}>
                      {payout.label} {payout.percent}% · {payout.amount} · {payout.status}
                    </div>
                  ))}
                </td>
                <td>
                  {deposit.status !== 'completed' && (
                    <button type="button" onClick={() => retryDeposit(deposit.id).then(load)}>
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
