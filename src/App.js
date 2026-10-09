import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { getToken, login, me, setToken } from './services/api';
import Field from './components/Field';
import Shell from './components/Shell';
import { ShellSkeleton } from './components/Skeleton';
import { useForm } from './hooks/useForm';
import { required } from './lib/validators';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import TopupsPage from './pages/TopupsPage';
import PoolPage from './pages/PoolPage';
import DepositsPage from './pages/DepositsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const loginRules = {
  username: required('Username'),
  password: required('Password'),
};

function LoginScreen({ onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const loginForm = useForm({ username: '', password: '' }, loginRules);
  const [error, setError] = useState('');

  async function onLogin(event) {
    event.preventDefault();
    setError('');
    if (!loginForm.validate()) return;
    try {
      const data = await login(loginForm.values.username.trim(), loginForm.values.password);
      setToken(data.token);
      onSuccess(data.admin);
      const next = location.state?.from;
      navigate(next && next !== '/login' ? next : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login">
      <motion.section className="login__story" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
        <span className="brand__mark">TD</span>
        <h1>Token Desk</h1>
        <p>Approve charge-wallet top-ups, create the USDT address pool, and set the split charge.</p>
      </motion.section>
      <section className="login__panel">
        <motion.form noValidate onSubmit={onLogin} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="kicker">Admin</p>
          <h2>Sign in</h2>
          <Field name="username" label="Username" error={loginForm.error('username')}>
            <input
              value={loginForm.values.username}
              onChange={(event) => loginForm.setField('username', event.target.value)}
              onBlur={() => loginForm.blur('username')}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </Field>
          <Field name="password" label="Password" error={loginForm.error('password')}>
            <input
              type="password"
              value={loginForm.values.password}
              onChange={(event) => loginForm.setField('password', event.target.value)}
              onBlur={() => loginForm.blur('password')}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Field>
          {loginForm.summary && <p className="form-alert" role="alert">{loginForm.summary}</p>}
          {error && <p className="form-alert" role="alert">{error}</p>}
          <button type="submit" className="primary"><HiOutlineArrowRightOnRectangle /> Sign in</button>
        </motion.form>
      </section>
    </main>
  );
}

function RequireAdmin({ admin, onSignOut }) {
  const location = useLocation();
  if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Shell account={admin} onSignOut={onSignOut} />;
}

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    me().then((data) => setAdmin(data.admin)).catch(() => setToken('')).finally(() => setReady(true));
  }, []);

  if (!ready) return <ShellSkeleton />;

  function signOut() {
    setToken('');
    setAdmin(null);
  }

  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <LoginScreen onSuccess={setAdmin} />} />
      <Route element={<RequireAdmin admin={admin} onSignOut={signOut} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/topups" element={<TopupsPage />} />
        <Route path="/pool" element={<PoolPage />} />
        <Route path="/deposits" element={<DepositsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={admin ? '/' : '/login'} replace />} />
    </Routes>
  );
}
