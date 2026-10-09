import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import RowMenu from '../components/RowMenu';
import { TableSkeleton } from '../components/Skeleton';
import { useRefresh } from '../hooks/useRefresh';
import { positiveAmount } from '../lib/validators';
import { getTopups, reviewTopup } from '../services/api';

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function TopupsPage() {
  const [topups, setTopups] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getTopups();
    setTopups(data.topups);
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

  if (loading) return <TableSkeleton columns={6} rows={5} />;

  return (
    <motion.section className="stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {error && <p className="error">{error}</p>}
      <article className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th className="col-num">#</th><th>User</th><th>Hash</th><th>Claimed</th><th>On-chain</th><th>Status</th><th className="col-actions" /></tr>
            </thead>
            <tbody>
              {topups.map((topup, index) => (
                <tr key={topup.id}>
                  <td className="col-num">{index + 1}</td>
                  <td>{topup.username}</td>
                  <td className="mono">{topup.txHash}</td>
                  <td>{money(topup.claimedAmount)}</td>
                  <td>{topup.onchainAmount == null ? '—' : money(topup.onchainAmount)}</td>
                  <td>
                    <span className={`pill is-${topup.status}`}>{topup.status}</span>
                    {topup.errorMessage && <div className="error">{topup.errorMessage}</div>}
                  </td>
                  <td className="col-actions">
                    {topup.status === 'pending' && (
                      <RowMenu label="Review top-up">
                        {(close) => (
                          <>
                            <div className={`field ${rowErrors[topup.id] ? 'is-invalid' : ''}`} data-field={`credit-${topup.id}`}>
                              <label htmlFor={`credit-${topup.id}`}>Credit amount</label>
                              <input
                                id={`credit-${topup.id}`}
                                inputMode="decimal"
                                placeholder="Credit amount"
                                aria-invalid={rowErrors[topup.id] ? true : undefined}
                                value={amounts[topup.id] ?? topup.claimedAmount}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setAmounts((current) => ({ ...current, [topup.id]: value }));
                                  setRowErrors((current) => {
                                    if (!current[topup.id]) return current;
                                    const message = positiveAmount('Credit amount')(value);
                                    const next = { ...current };
                                    if (message) next[topup.id] = message;
                                    else delete next[topup.id];
                                    return next;
                                  });
                                }}
                              />
                              {rowErrors[topup.id] && <p className="field__error" role="alert">{rowErrors[topup.id]}</p>}
                            </div>
                            <button
                              type="button"
                              className="primary"
                              onClick={() => {
                                const value = amounts[topup.id] ?? topup.claimedAmount;
                                const message = positiveAmount('Credit amount')(value);
                                if (message) {
                                  setRowErrors((current) => ({ ...current, [topup.id]: message }));
                                  return;
                                }
                                close();
                                setError('');
                                reviewTopup(topup.id, { decision: 'approve', amount: Number(value) })
                                  .then(load)
                                  .catch((err) => setError(err.message));
                              }}
                            >
                              Approve
                            </button>
                            <button type="button" className="ghost" onClick={() => { close(); reviewTopup(topup.id, { decision: 'reject' }).then(load).catch((err) => setError(err.message)); }}>Reject</button>
                          </>
                        )}
                      </RowMenu>
                    )}
                  </td>
                </tr>
              ))}
              {topups.length === 0 && <tr><td colSpan="7" className="muted">No top-ups yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </motion.section>
  );
}
