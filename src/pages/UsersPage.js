import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineKey,
  HiOutlineMinusCircle,
  HiOutlineNoSymbol,
  HiOutlinePlusCircle,
  HiOutlineUserPlus,
} from 'react-icons/hi2';
import Dialog from '../components/Dialog';
import Field from '../components/Field';
import RowMenu from '../components/RowMenu';
import { TableSkeleton } from '../components/Skeleton';
import { useForm } from '../hooks/useForm';
import { useRefresh } from '../hooks/useRefresh';
import { password, positiveAmount, username } from '../lib/validators';
import { adjustUserWallet, createUser, getUsers, setUserPassword, setUserStatus } from '../services/api';

const emptyForm = { username: '', password: '' };
const rules = {
  username: username(),
  password: password(6),
};

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const form = useForm(emptyForm, rules);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [note, setNote] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);

  function load() {
    return getUsers().then((data) => setUsers(data.users));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  useRefresh(async () => {
    setLoading(true);
    setError('');
    try {
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  });

  function openAction(user, kind, close) {
    close();
    setPasswordValue('');
    setPasswordError('');
    setAmount('');
    setAmountError('');
    setNote('');
    setDialogError('');
    setAction({ user, kind });
  }

  function closeAction() {
    if (dialogBusy) return;
    setAction(null);
  }

  async function onCreate(event) {
    event.preventDefault();
    setCreateError('');
    setNotice('');
    if (!form.validate()) return;
    setBusy(true);
    try {
      await createUser({ username: form.values.username.trim(), password: form.values.password });
      form.replace(emptyForm);
      setNotice('User created. They can sign in on the client.');
      setCreating(false);
      await load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSavePassword() {
    const message = password(6)(passwordValue);
    setPasswordError(message);
    if (message || !action) return;
    setDialogBusy(true);
    setDialogError('');
    try {
      await setUserPassword(action.user.id, passwordValue);
      setNotice(`Password updated for ${action.user.username}. They need to sign in again.`);
      setAction(null);
      await load();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setDialogBusy(false);
    }
  }

  async function onSaveStatus() {
    if (!action) return;
    const next = !action.user.active;
    setDialogBusy(true);
    setDialogError('');
    try {
      await setUserStatus(action.user.id, next);
      setNotice(next ? `${action.user.username} is active.` : `${action.user.username} is disabled.`);
      setAction(null);
      await load();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setDialogBusy(false);
    }
  }

  async function onSaveWallet() {
    const message = positiveAmount('Amount')(amount);
    setAmountError(message);
    if (message || !action) return;
    setDialogBusy(true);
    setDialogError('');
    try {
      await adjustUserWallet(action.user.id, {
        direction: action.kind,
        amount: Number(amount),
        note: note.trim(),
      });
      setNotice(`${action.kind === 'credit' ? 'Credited' : 'Debited'} ${action.user.username}.`);
      setAction(null);
      await load();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setDialogBusy(false);
    }
  }

  const enabling = action?.kind === 'status' && !action.user.active;
  const dialogTitle = !action ? ''
    : action.kind === 'password' ? 'Change password'
      : action.kind === 'status' ? (enabling ? 'Enable this account?' : 'Disable this account?')
        : action.kind === 'credit' ? 'Credit charge wallet'
          : 'Debit charge wallet';
  const DialogIcon = !action ? null
    : action.kind === 'password' ? HiOutlineKey
      : action.kind === 'status' ? (enabling ? HiOutlineCheckCircle : HiOutlineNoSymbol)
        : action.kind === 'credit' ? HiOutlinePlusCircle
          : HiOutlineMinusCircle;
  const dialogTone = !action ? 'accent'
    : action.kind === 'status' && !enabling ? 'danger'
      : action.kind === 'debit' ? 'warn'
        : action.kind === 'credit' || enabling ? 'ok'
          : 'accent';

  return (
    <motion.section className="stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {error && <p className="form-alert" role="alert">{error}</p>}
      {notice && <p className="form-alert is-ok">{notice}</p>}
      <article className="card">
        <div className="card__head">
          <div>
            <h2>Users</h2>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => {
              form.replace(emptyForm);
              setCreateError('');
              setCreating(true);
            }}
          >
            <HiOutlineUserPlus /> Create user
          </button>
        </div>
        {loading ? <TableSkeleton columns={5} rows={5} /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Username</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td className="col-num">{index + 1}</td>
                  <td>{user.username}</td>
                  <td>{money(user.balance)} USDT</td>
                  <td><span className={`pill ${user.active ? 'is-available' : 'is-rejected'}`}>{user.active ? 'Active' : 'Disabled'}</span></td>
                  <td>{new Date(user.created_at).toLocaleString()}</td>
                  <td className="col-actions">
                    <RowMenu label={`${user.username} actions`}>
                      {(close) => (
                        <>
                          <button type="button" className="ghost" onClick={() => openAction(user, 'password', close)}>Change password</button>
                          <button type="button" className="ghost" onClick={() => openAction(user, 'status', close)}>{user.active ? 'Disable account' : 'Enable account'}</button>
                          <button type="button" className="ghost" onClick={() => openAction(user, 'credit', close)}>Credit wallet</button>
                          <button type="button" className="ghost" onClick={() => openAction(user, 'debit', close)}>Debit wallet</button>
                        </>
                      )}
                    </RowMenu>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="6" className="muted">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
        )}
      </article>
      <Dialog
        open={creating}
        title="Create user"
        tone="accent"
        icon={HiOutlineUserPlus}
        onClose={() => { if (!busy) setCreating(false); }}
      >
        <form className="stack" noValidate onSubmit={onCreate}>
          <Field name="username" label="Username" error={form.error('username')}>
            <input
              value={form.values.username}
              onChange={(event) => form.setField('username', event.target.value)}
              onBlur={() => form.blur('username')}
              placeholder="New username"
              autoComplete="off"
            />
          </Field>
          <Field name="password" label="Password" error={form.error('password')}>
            <input
              type="text"
              value={form.values.password}
              onChange={(event) => form.setField('password', event.target.value)}
              onBlur={() => form.blur('password')}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </Field>
          {form.summary && <p className="form-alert" role="alert">{form.summary}</p>}
          {createError && <p className="form-alert" role="alert">{createError}</p>}
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setCreating(false)} disabled={busy}>Cancel</button>
            <button type="submit" className="primary" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
          </div>
        </form>
      </Dialog>
      <Dialog open={Boolean(action)} title={dialogTitle} tone={dialogTone} icon={DialogIcon} onClose={closeAction}>
        {action?.kind === 'password' && (
          <>
            <Field name="new-password" label="New password" error={passwordError}>
              <input
                type="text"
                value={passwordValue}
                onChange={(event) => {
                  setPasswordValue(event.target.value);
                  if (passwordError) setPasswordError(password(6)(event.target.value));
                }}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </Field>
            {dialogError && <p className="form-alert" role="alert">{dialogError}</p>}
            <div className="actions">
              <button type="button" className="ghost" onClick={closeAction} disabled={dialogBusy}>Cancel</button>
              <button type="button" className="primary" onClick={onSavePassword} disabled={dialogBusy}>{dialogBusy ? 'Saving…' : 'Save password'}</button>
            </div>
          </>
        )}
        {action?.kind === 'status' && (
          <>
            {dialogError && <p className="form-alert" role="alert">{dialogError}</p>}
            <div className="actions">
              <button type="button" className="ghost" onClick={closeAction} disabled={dialogBusy}>Cancel</button>
              <button type="button" className={enabling ? 'primary' : 'danger'} onClick={onSaveStatus} disabled={dialogBusy}>
                {dialogBusy ? 'Saving…' : enabling ? 'Enable account' : 'Disable account'}
              </button>
            </div>
          </>
        )}
        {(action?.kind === 'credit' || action?.kind === 'debit') && (
          <>
            <Field name="amount" label="Amount" error={amountError}>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  if (amountError) setAmountError(positiveAmount('Amount')(event.target.value));
                }}
                placeholder="Amount in USDT"
              />
            </Field>
            <Field name="note" label="Note">
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reason for this adjustment" maxLength={255} />
            </Field>
            {dialogError && <p className="form-alert" role="alert">{dialogError}</p>}
            <div className="actions">
              <button type="button" className="ghost" onClick={closeAction} disabled={dialogBusy}>Cancel</button>
              <button type="button" className={action.kind === 'debit' ? 'danger' : 'primary'} onClick={onSaveWallet} disabled={dialogBusy}>
                {dialogBusy ? 'Saving…' : action.kind === 'credit' ? 'Credit wallet' : 'Debit wallet'}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </motion.section>
  );
}
