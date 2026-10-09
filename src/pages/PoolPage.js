import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HiOutlineDocumentDuplicate, HiOutlineKey, HiOutlineNoSymbol, HiOutlinePaperAirplane, HiOutlinePlus } from 'react-icons/hi2';
import Dialog from '../components/Dialog';
import Field from '../components/Field';
import RowMenu from '../components/RowMenu';
import { TableSkeleton } from '../components/Skeleton';
import { useRefresh } from '../hooks/useRefresh';
import { ethAddress, positiveAmount } from '../lib/validators';
import { createHotWallet, getHotWallets, revealHotWallet, setHotWalletDisabled, transferBnb, transferUsdt } from '../services/api';

function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement('textarea');
  input.value = value;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
  return Promise.resolve();
}

function coin(value) {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  if (amount === 0) return '0';
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function PoolPage() {
  const [wallets, setWallets] = useState([]);
  const [gasFunder, setGasFunder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [secret, setSecret] = useState(null);
  const [copied, setCopied] = useState('');
  const [transfer, setTransfer] = useState(null);
  const [destination, setDestination] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferHash, setTransferHash] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [disableTarget, setDisableTarget] = useState(null);
  const [disableBusy, setDisableBusy] = useState(false);

  async function load() {
    const data = await getHotWallets();
    setWallets(data.wallets);
    setGasFunder(data.gasFunder || null);
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

  function openTransfer(wallet, asset, close) {
    close();
    setDestination('');
    setBnbAmount('');
    setDestinationError('');
    setAmountError('');
    setTransferError('');
    setTransferHash('');
    setTransfer({ ...wallet, asset });
  }

  function closeTransfer() {
    if (transferBusy) return;
    setTransfer(null);
  }

  async function onTransfer(event) {
    event.preventDefault();
    const nextDestination = ethAddress('Destination')(destination);
    const nextAmount = positiveAmount('Amount')(bnbAmount);
    setDestinationError(nextDestination);
    setAmountError(nextAmount);
    if (nextDestination || nextAmount || !transfer) return;
    setTransferBusy(true);
    setTransferError('');
    try {
      const send = transfer.asset === 'usdt' ? transferUsdt : transferBnb;
      const data = await send(transfer.id, { to: destination.trim(), amount: bnbAmount.trim() });
      setTransferHash(data.transfer.hash);
      await load();
    } catch (err) {
      setTransferError(err.message);
    } finally {
      setTransferBusy(false);
    }
  }

  async function onCreate() {
    setBusy(true);
    setError('');
    try {
      const data = await createHotWallet();
      setConfirming(false);
      setSecret({
        address: data.wallet.address,
        privateKey: data.wallet.privateKey,
        phrase: data.wallet.phrase,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onReveal(id, close) {
    setError('');
    try {
      const data = await revealHotWallet(id);
      close();
      setSecret({
        address: data.wallet.address,
        privateKey: data.wallet.privateKey,
        phrase: data.wallet.phrase,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function onToggleDisabled() {
    if (!disableTarget) return;
    setDisableBusy(true);
    setError('');
    try {
      await setHotWalletDisabled(disableTarget.id, !disableTarget.disabled);
      setDisableTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDisableBusy(false);
    }
  }

  async function onCopy(id, value) {
    await copyText(value);
    setCopied(id);
    setTimeout(() => setCopied(''), 1400);
  }

  if (loading) return <TableSkeleton columns={7} rows={5} />;

  return (
    <motion.section className="stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <article className="card card__row">
        <div>
          <h2>USDT address pool</h2>
        </div>
        <div className="pool-head">
          {gasFunder && (
            <div className="pool-funder">
              <span>BNB funder</span>
              <strong>{coin(gasFunder.bnbBalance)} BNB</strong>
              <span className="mono">{gasFunder.address}</span>
            </div>
          )}
          <button type="button" className="primary" onClick={() => setConfirming(true)} disabled={busy}>
            <HiOutlinePlus />
            Create address
          </button>
        </div>
      </article>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <article className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Address</th>
                <th>USDT</th>
                <th>BNB</th>
                <th>Status</th>
                <th>Created</th>
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => (
                <tr key={wallet.id}>
                  <td className="col-num">{index + 1}</td>
                  <td className="mono">{wallet.address}</td>
                  <td>{coin(wallet.usdtBalance)}</td>
                  <td>{coin(wallet.bnbBalance)}</td>
                  <td>
                    <span className="status-pills">
                      <span className={`pill is-${wallet.status}`}>{wallet.status}</span>
                      {wallet.disabled ? <span className="pill is-rejected">Disabled</span> : null}
                    </span>
                  </td>
                  <td>{new Date(wallet.created_at).toLocaleString()}</td>
                  <td className="col-actions">
                    <RowMenu label="Address actions">
                      {(close) => (
                        <>
                          <button type="button" className="ghost" onClick={() => onReveal(wallet.id, close)}>Show key</button>
                          <button type="button" className="ghost" onClick={() => openTransfer(wallet, 'bnb', close)}>Transfer BNB</button>
                          <button type="button" className="ghost" onClick={() => openTransfer(wallet, 'usdt', close)}>Transfer USDT</button>
                          <button
                            type="button"
                            className={wallet.disabled ? 'ghost' : 'ghost danger'}
                            onClick={() => {
                              close();
                              setDisableTarget(wallet);
                            }}
                          >
                            {wallet.disabled ? 'Enable address' : 'Disable address'}
                          </button>
                        </>
                      )}
                    </RowMenu>
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && <tr><td colSpan="7" className="muted">No addresses yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
      <Dialog
        open={Boolean(disableTarget)}
        title={disableTarget?.disabled ? 'Enable this address?' : 'Disable this address?'}
        tone={disableTarget?.disabled ? 'accent' : 'danger'}
        icon={HiOutlineNoSymbol}
        onClose={() => { if (!disableBusy) setDisableTarget(null); }}
      >
        {disableTarget && (
          <>
            <p className="secret-value mono">{disableTarget.address}</p>
            <p>
              {disableTarget.disabled
                ? 'New deposit requests can use this address again once it is free.'
                : 'New deposit requests will skip this address. A deposit already using it will keep going.'}
            </p>
            <div className="actions">
              <button type="button" className="ghost" onClick={() => setDisableTarget(null)} disabled={disableBusy}>Cancel</button>
              <button type="button" className={disableTarget.disabled ? 'primary' : 'danger'} onClick={onToggleDisabled} disabled={disableBusy}>
                {disableBusy ? 'Saving…' : disableTarget.disabled ? 'Enable address' : 'Disable address'}
              </button>
            </div>
          </>
        )}
      </Dialog>
      <Dialog open={confirming} title="Create a deposit address?" tone="accent" icon={HiOutlinePlus} onClose={() => { if (!busy) setConfirming(false); }}>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
          <button type="button" className="primary" onClick={onCreate} disabled={busy}>{busy ? 'Creating…' : 'Create address'}</button>
        </div>
      </Dialog>
      <Dialog open={Boolean(transfer)} title={transfer?.asset === 'usdt' ? 'Transfer USDT' : 'Transfer BNB'} tone="accent" icon={HiOutlinePaperAirplane} onClose={closeTransfer}>
        {transfer && (
          <form className="stack" noValidate onSubmit={onTransfer}>
            <div>
              <span className="muted">From</span>
              <p className="secret-value mono">{transfer.address}</p>
              <p className="muted">Available {coin(transfer.asset === 'usdt' ? transfer.usdtBalance : transfer.bnbBalance)} {transfer.asset === 'usdt' ? 'USDT' : 'BNB'}</p>
            </div>
            <Field name="destination" label="Destination address" error={destinationError}>
              <input
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  if (destinationError) setDestinationError(ethAddress('Destination')(event.target.value));
                }}
                placeholder="0x destination"
                autoComplete="off"
              />
            </Field>
            <Field name="bnb-amount" label="Amount" error={amountError}>
              <input
                inputMode="decimal"
                value={bnbAmount}
                onChange={(event) => {
                  setBnbAmount(event.target.value);
                  if (amountError) setAmountError(positiveAmount('Amount')(event.target.value));
                }}
                placeholder="0.01"
              />
            </Field>
            {transferError && <p className="form-alert" role="alert">{transferError}</p>}
            {transferHash && <p className="form-alert is-ok">Sent. Transaction {transferHash}</p>}
            <div className="actions">
              <button type="button" className="ghost" onClick={closeTransfer} disabled={transferBusy}>Close</button>
              <button type="submit" className="primary" disabled={transferBusy}>{transferBusy ? 'Sending…' : transfer.asset === 'usdt' ? 'Send USDT' : 'Send BNB'}</button>
            </div>
          </form>
        )}
      </Dialog>
      <Dialog open={Boolean(secret)} title="Wallet secret" tone="warn" icon={HiOutlineKey} wide onClose={() => setSecret(null)}>
        {secret && (
          <>
            <div>
              <span className="muted">Address</span>
              <p className="secret-value mono">{secret.address}</p>
            </div>
            <div>
              <span className="muted">Private key</span>
              <p className="secret-value mono">{secret.privateKey}</p>
              <button type="button" className="ghost" onClick={() => onCopy('key', secret.privateKey)}>
                <HiOutlineDocumentDuplicate />
                {copied === 'key' ? 'Copied' : 'Copy private key'}
              </button>
            </div>
            {secret.phrase ? (
              <div>
                <span className="muted">Recovery phrase</span>
                <p className="secret-value">{secret.phrase}</p>
                <button type="button" className="ghost" onClick={() => onCopy('phrase', secret.phrase)}>
                  <HiOutlineDocumentDuplicate />
                  {copied === 'phrase' ? 'Copied' : 'Copy phrase'}
                </button>
              </div>
            ) : (
              <p className="muted">This address was created before recovery phrases were stored. Import the private key into Trust Wallet.</p>
            )}
            <div className="actions">
              <button type="button" className="primary" onClick={() => setSecret(null)}>Close</button>
            </div>
          </>
        )}
      </Dialog>
    </motion.section>
  );
}
