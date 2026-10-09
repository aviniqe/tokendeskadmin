import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { getDeposits, retryDeposit } from '../services/api';
import Dialog from '../components/Dialog';
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

function SpinIcon() {
  return <HiOutlineArrowPath className="spin" />;
}

function resultView(deposit) {
  if (deposit.status === 'completed') {
    return { title: 'Split completed', tone: 'ok', icon: HiOutlineCheckCircle, text: 'The payout transfers finished.' };
  }
  if (deposit.status === 'insufficient_balance') {
    return { title: 'Charge balance is too low', tone: 'warn', icon: HiOutlineExclamationTriangle, text: 'The USDT is still on the deposit address.' };
  }
  if (deposit.status === 'waiting') {
    return { title: 'Still waiting for USDT', tone: 'accent', icon: HiOutlineExclamationTriangle, text: 'No USDT has been recorded on this deposit yet.' };
  }
  if (deposit.status === 'expired') {
    return { title: 'Deposit expired', tone: 'warn', icon: HiOutlineExclamationTriangle, text: 'This deposit can no longer be split.' };
  }
  if (deposit.status === 'distributing') {
    return { title: 'Split is still running', tone: 'accent', icon: HiOutlineArrowPath, text: 'The deposit is still being distributed.' };
  }
  return { title: 'Split failed', tone: 'danger', icon: HiOutlineExclamationTriangle, text: 'The payout transfer did not finish.' };
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(null);

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

  async function onRetry(id) {
    setError('');
    setRetry({ phase: 'loading' });
    try {
      const data = await retryDeposit(id);
      setRetry({ phase: 'result', deposit: data.deposit });
      await load();
    } catch (err) {
      setRetry({ phase: 'error', message: err.message || 'The split could not be retried.' });
    }
  }

  function closeRetry() {
    if (retry?.phase === 'loading') return;
    setRetry(null);
  }

  if (loading) return <TableSkeleton columns={6} rows={5} />;
  const visible = status === 'all' ? deposits : deposits.filter((deposit) => deposit.status === status);
  const outcome = retry?.phase === 'result' ? resultView(retry.deposit) : null;

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
                          <button type="button" className="primary" onClick={() => { close(); onRetry(deposit.id); }}>
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
      <Dialog
        open={Boolean(retry)}
        title={retry?.phase === 'loading' ? 'Retrying split' : retry?.phase === 'error' ? 'Split could not be retried' : outcome?.title}
        tone={retry?.phase === 'error' ? 'danger' : outcome?.tone || 'accent'}
        icon={retry?.phase === 'loading' ? SpinIcon : retry?.phase === 'error' ? HiOutlineExclamationTriangle : outcome?.icon}
        wide={retry?.phase === 'result'}
        onClose={closeRetry}
      >
        {retry?.phase === 'loading' && <p>Sending the payout transfers.</p>}
        {retry?.phase === 'error' && <p className="error">{retry.message}</p>}
        {retry?.phase === 'result' && (
          <>
            <p>{retry.deposit.errorMessage || outcome.text}</p>
            <p><span className={`pill is-${retry.deposit.status}`}>{retry.deposit.status}</span></p>
            {retry.deposit.payouts?.length > 0 && (
              <div className="stack">
                {retry.deposit.payouts.map((payout) => (
                  <div key={payout.id} className="retry-payout">
                    <div className="payout-line">
                      <strong>{payout.label || 'Payout'}</strong>
                      <span>{money(payout.amount)} USDT</span>
                      <span className={`pill is-${payout.status}`}>{payout.status}</span>
                    </div>
                    {payout.txHash && <p className="mono">{payout.txHash}</p>}
                    {payout.errorMessage && <p className="error">{payout.errorMessage}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {retry?.phase !== 'loading' && (
          <div className="actions">
            <button type="button" className="primary" onClick={closeRetry}>Close</button>
          </div>
        )}
      </Dialog>
    </motion.section>
  );
}
