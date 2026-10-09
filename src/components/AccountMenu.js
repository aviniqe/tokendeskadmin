import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineArrowRightOnRectangle, HiOutlineChevronDown, HiOutlineKey } from 'react-icons/hi2';
import Dialog from './Dialog';
import Field from './Field';
import { useForm } from '../hooks/useForm';
import { password, required } from '../lib/validators';

const emptyPassword = { currentPassword: '', password: '', confirm: '' };

function initials(name) {
  const text = String(name || '').trim();
  if (!text) return 'TD';
  return text.slice(0, 2).toUpperCase();
}

export default function AccountMenu({ name, role, changePassword, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const form = useForm(emptyPassword, {
    currentPassword: required('Current password'),
    password: password(6),
    confirm: (value, values) => {
      if (!String(value ?? '')) return 'Confirm the new password';
      if (value !== values.password) return 'Passwords do not match';
      return '';
    },
  });

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function closePassword() {
    if (busy) return;
    setPasswordOpen(false);
    form.replace(emptyPassword);
    setError('');
  }

  async function onSavePassword(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!form.validate()) return;
    setBusy(true);
    try {
      await changePassword(form.values.currentPassword, form.values.password);
      form.replace(emptyPassword);
      setPasswordOpen(false);
      setNotice('Password updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile" ref={rootRef}>
      <button
        type="button"
        className={`profile__chip${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${name} account`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="profile__mark">{initials(name)}</span>
        <span className="profile__meta">
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
        <HiOutlineChevronDown className="profile__chevron" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="profile__menu"
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setOpen(false);
                setNotice('');
                setError('');
                form.replace(emptyPassword);
                setPasswordOpen(true);
              }}
            >
              <HiOutlineKey /> Change password
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setOpen(false);
                setConfirmOut(true);
              }}
            >
              <HiOutlineArrowRightOnRectangle /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {notice && <p className="profile__notice">{notice}</p>}
      <Dialog open={passwordOpen} title="Change password" tone="accent" icon={HiOutlineKey} onClose={closePassword}>
        <form className="stack" noValidate onSubmit={onSavePassword}>
          <Field name="currentPassword" label="Current password" error={form.error('currentPassword')}>
            <input
              type="password"
              value={form.values.currentPassword}
              onChange={(event) => form.setField('currentPassword', event.target.value)}
              onBlur={() => form.blur('currentPassword')}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </Field>
          <Field name="password" label="New password" error={form.error('password')}>
            <input
              type="password"
              value={form.values.password}
              onChange={(event) => form.setField('password', event.target.value)}
              onBlur={() => form.blur('password')}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </Field>
          <Field name="confirm" label="Confirm new password" error={form.error('confirm')}>
            <input
              type="password"
              value={form.values.confirm}
              onChange={(event) => form.setField('confirm', event.target.value)}
              onBlur={() => form.blur('confirm')}
              placeholder="Repeat the new password"
              autoComplete="new-password"
            />
          </Field>
          {form.summary && <p className="form-alert" role="alert">{form.summary}</p>}
          {error && <p className="form-alert" role="alert">{error}</p>}
          <div className="actions">
            <button type="button" className="ghost" onClick={closePassword} disabled={busy}>Cancel</button>
            <button type="submit" className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
          </div>
        </form>
      </Dialog>
      <Dialog open={confirmOut} title="Sign out?" tone="danger" icon={HiOutlineArrowRightOnRectangle} onClose={() => setConfirmOut(false)}>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => setConfirmOut(false)}>Stay signed in</button>
          <button type="button" className="danger" onClick={onSignOut}>Log out</button>
        </div>
      </Dialog>
    </div>
  );
}
