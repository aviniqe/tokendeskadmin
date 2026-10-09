import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  HiOutlineBars3,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCircleStack,
  HiOutlineCog6Tooth,
  HiOutlineArrowPath,
  HiOutlineMoon,
  HiOutlineQueueList,
  HiOutlineSquares2X2,
  HiOutlineSun,
  HiOutlineUsers,
  HiOutlineWallet,
} from 'react-icons/hi2';
import AccountMenu from './AccountMenu';
import { requestRefresh } from '../hooks/useRefresh';
import { changePassword } from '../services/api';

const STORAGE_KEY = 'tokendesk_admin_sidebar_collapsed';
const THEME_KEY = 'tokendesk_admin_theme';

const NAV = [
  { to: '/', label: 'Dashboard', end: true, icon: HiOutlineSquares2X2 },
  { to: '/users', label: 'Users', icon: HiOutlineUsers },
  { to: '/topups', label: 'Top-ups', icon: HiOutlineQueueList },
  { to: '/pool', label: 'Address pool', icon: HiOutlineCircleStack },
  { to: '/deposits', label: 'Deposits', icon: HiOutlineWallet },
  { to: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
];

const TITLES = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/topups': 'Top-ups',
  '/pool': 'Address pool',
  '/deposits': 'Deposits',
  '/settings': 'Settings',
};

export default function Shell({ account, onSignOut }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.innerWidth <= 800);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [theme, setTheme] = useState(() => (localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'));
  const [refreshing, setRefreshing] = useState(false);
  const title = TITLES[location.pathname] || 'Token Desk';
  const narrow = collapsed && !mobile;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onResize() { setMobile(window.innerWidth <= 800); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await requestRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <div className="shell">
      {open && mobile && <button type="button" className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <motion.aside
        className={`side ${open ? 'is-open' : ''} ${narrow ? 'is-collapsed' : ''}`}
        initial={false}
        animate={mobile ? { width: 248, x: open ? 0 : -270 } : { width: narrow ? 76 : 248, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className="side__top">
          <button type="button" className="collapse-btn" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
          </button>
          <NavLink to="/" className="brand" title="Dashboard" end>
            <span className="brand__mark">TD</span>
            <span className="brand__text"><strong>Token Desk</strong><small>Admin</small></span>
          </NavLink>
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className={({ isActive }) => `nav-link ${isActive ? 'is-on' : ''}`}>
                <Icon /><span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </motion.aside>
      <motion.div className="workspace" initial={false} animate={{ marginLeft: mobile ? 0 : (narrow ? 76 : 248) }} transition={{ duration: 0.22, ease: 'easeOut' }}>
        <header className="topbar">
          <div className="topbar__lead">
            <button type="button" className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><HiOutlineBars3 /></button>
            <h1>{title}</h1>
          </div>
          <div className="topbar__tools">
            <button type="button" className={`icon-btn${refreshing ? ' is-spin' : ''}`} onClick={onRefresh} disabled={refreshing} aria-label="Refresh">
              <HiOutlineArrowPath />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>
            <AccountMenu name={account?.username || 'Admin'} role="Admin" changePassword={changePassword} onSignOut={onSignOut} />
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
