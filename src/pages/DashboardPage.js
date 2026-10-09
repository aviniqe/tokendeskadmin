import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getDeposits, getHotWallets, getSettings, getTopups, getUsers } from '../services/api';
import { DashboardSkeleton } from '../components/Skeleton';
import { useRefresh } from '../hooks/useRefresh';

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function countStatus(rows, status) {
  return rows.filter((row) => row.status === status).length;
}

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [topups, setTopups] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), getTopups(), getHotWallets(), getDeposits(), getSettings()])
      .then(([userData, topupData, walletData, depositData, settingsData]) => {
        setUsers(userData.users);
        setTopups(topupData.topups);
        setWallets(walletData.wallets);
        setDeposits(depositData.deposits);
        setSettings(settingsData.settings);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useRefresh(async () => {
    setLoading(true);
    setError('');
    try {
      const [userData, topupData, walletData, depositData, settingsData] = await Promise.all([
        getUsers(), getTopups(), getHotWallets(), getDeposits(), getSettings(),
      ]);
      setUsers(userData.users);
      setTopups(topupData.topups);
      setWallets(walletData.wallets);
      setDeposits(depositData.deposits);
      setSettings(settingsData.settings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  });

  if (loading) return <DashboardSkeleton />;

  const chargeBalance = users.reduce((sum, user) => sum + Number(user.balance || 0), 0);
  const received = deposits.reduce((sum, deposit) => sum + Number(deposit.receivedAmount || 0), 0);
  const charges = deposits.reduce((sum, deposit) => sum + Number(deposit.chargeAmount || 0), 0);
  const poolUsdt = wallets.reduce((sum, wallet) => sum + Number(wallet.usdtBalance || 0), 0);
  const poolBnb = wallets.reduce((sum, wallet) => sum + Number(wallet.bnbBalance || 0), 0);
  const available = countStatus(wallets, 'available');
  const assigned = countStatus(wallets, 'assigned');

  const stats = [
    ['Users', String(users.length)],
    ['Charge balances', `${money(chargeBalance)} USDT`],
    ['Pool addresses', `${available} free / ${assigned} locked`],
    ['Pool USDT', money(poolUsdt)],
    ['Pool BNB', money(poolBnb)],
    ['USDT received', money(received)],
    ['Charges taken', `${money(charges)} USDT`],
    ['Pending top-ups', String(countStatus(topups, 'pending'))],
    ['Waiting deposits', String(countStatus(deposits, 'waiting'))],
    ['Completed deposits', String(countStatus(deposits, 'completed'))],
    ['Failed deposits', String(countStatus(deposits, 'failed'))],
    ['Charge ranges', Array.isArray(settings?.chargeRanges) && settings.chargeRanges.length ? String(settings.chargeRanges.length) : 'None'],
  ];

  return (
    <motion.section className="stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <div className="stats">
        {stats.map(([label, value], index) => (
          <motion.article key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.article>
        ))}
      </div>
      <div className="split">
        <article className="card">
          <header className="card__head"><h2>Needs attention</h2></header>
          <p className="muted">{countStatus(topups, 'pending')} top-up{countStatus(topups, 'pending') === 1 ? '' : 's'} waiting for review. {countStatus(deposits, 'insufficient_balance')} deposit{countStatus(deposits, 'insufficient_balance') === 1 ? '' : 's'} waiting on a charge balance. {countStatus(deposits, 'expired')} deposit{countStatus(deposits, 'expired') === 1 ? '' : 's'} expired without payment.</p>
          <div className="actions">
            <Link className="text-link" to="/topups">Review top-ups</Link>
            <Link className="text-link" to="/deposits">Open deposits</Link>
          </div>
        </article>
        <article className="card">
          <header className="card__head"><h2>Address pool</h2></header>
          <p className="muted">{wallets.length} addresses</p>
          <Link className="text-link" to="/pool">Manage addresses</Link>
        </article>
      </div>
    </motion.section>
  );
}
