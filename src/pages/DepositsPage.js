import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getDeposits, retryDeposit } from '../services/api';
import RowMenu from '../components/RowMenu';
import SearchSelect from '../components/SearchSelect';
import { TableSkeleton } from '../components/Skeleton';
import { useRefresh } from '../hooks/useRefresh';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'distributing', label: 'Distributing' },
  { value: 'insufficient_balance', label: 'Needs charge balance' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
];

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getDeposits();
    setDeposits(data.deposits);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
    const timer = setInterval(() => { load().catch(() => {}); }, 10000);
    return () => clearInterval(timer);
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

  if (loading) return <TableSkeleton columns={6} rows={5} />;
  const visible = status === 'all' ? deposits : deposits.filter((deposit) => deposit.status === status);

  return (
    <motion.section className="stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <article className="card card__row">
        <div>
          <h2>Deposit requests</h2>
        </div>
        <SearchSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} placeholder="Filter by status" searchPlaceholder="Search statuses" />
      </article>
      {error && <p className="error">{error}</p>}
      <article className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th className="col-num">#</th><th>User</th><th>Address</th><th>Status</th><th>Received</th><th>Charge</th><th className="col-actions" /></tr></thead>
            <tbody>
              {visible.map((deposit, index) => (
                <tr key={deposit.id}>
                  <td className="col-num">{index + 1}</td>
                  <td>{deposit.username}</td>
                  <td className="mono">{deposit.address}</td>
                  <td>
                    <span className={`pill is-${deposit.status}`}>{deposit.status}</span>
                    {deposit.errorMessage && <div className="error">{deposit.errorMessage}</div>}
                  </td>
                  <td>{money(deposit.receivedAmount)}</td>
                  <td>{money(deposit.chargeAmount)}</td>
                  <td className="col-actions">
                    {deposit.status !== 'completed' && deposit.status !== 'expired' && (
                      <RowMenu label="Deposit actions">
                        {(close) => (
                          <button type="button" className="primary" onClick={() => { close(); retryDeposit(deposit.id).then(load).catch((err) => setError(err.message)); }}>
                            Retry split
                          </button>
                        )}
                      </RowMenu>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan="7" className="muted">No deposits for this status.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </motion.section>
  );
}
