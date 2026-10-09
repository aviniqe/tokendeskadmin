import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineDocumentDuplicate, HiOutlineTrash } from 'react-icons/hi2';
import Dialog from '../components/Dialog';
import Field from '../components/Field';
import SearchSelect from '../components/SearchSelect';
import { FormSkeleton } from '../components/Skeleton';
import { useRefresh } from '../hooks/useRefresh';
import { useForm } from '../hooks/useForm';
import { chainId, ethAddress, httpUrl, nonNegative, percentRange, privateKey } from '../lib/validators';
import { getSettings, saveSettings } from '../services/api';

const CHAIN_OPTIONS = [
  { value: '56', label: 'BNB Smart Chain (56)' },
  { value: '97', label: 'BNB Smart Chain Testnet (97)' },
];
const emptyForm = {
  bscRpcUrl: '',
  chainId: '56',
  usdtContract: '',
  gasFunderPrivateKey: '',
  clearGasFunder: false,
  chargeFlat: '0',
  chargePercent: '0',
  platformDepositAddress: '',
};
const rules = {
  chargeFlat: nonNegative('Flat charge'),
  chargePercent: percentRange('Percent charge'),
  platformDepositAddress: ethAddress('Platform deposit address', { optional: true }),
  bscRpcUrl: httpUrl('RPC URL'),
  chainId: chainId(),
  usdtContract: ethAddress('USDT contract'),
  gasFunderPrivateKey: privateKey(),
};

export default function SettingsPage() {
  const form = useForm(emptyForm, rules);
  const replaceRef = useRef(form.replace);
  replaceRef.current = form.replace;
  const [saved, setSaved] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setSaved(data.settings);
        replaceRef.current({
          bscRpcUrl: data.settings.bscRpcUrl || '',
          chainId: String(data.settings.chainId ?? ''),
          usdtContract: data.settings.usdtContract || '',
          gasFunderPrivateKey: '',
          clearGasFunder: false,
          chargeFlat: String(data.settings.chargeFlat ?? '0'),
          chargePercent: String(data.settings.chargePercent ?? '0'),
          platformDepositAddress: data.settings.platformDepositAddress || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setReady(true));
  }, []);

  useRefresh(async () => {
    setReady(false);
    setError('');
    try {
      const data = await getSettings();
      setSaved(data.settings);
      replaceRef.current({
        bscRpcUrl: data.settings.bscRpcUrl || '',
        chainId: String(data.settings.chainId ?? ''),
        usdtContract: data.settings.usdtContract || '',
        gasFunderPrivateKey: '',
        clearGasFunder: false,
        chargeFlat: String(data.settings.chargeFlat ?? '0'),
        chargePercent: String(data.settings.chargePercent ?? '0'),
        platformDepositAddress: data.settings.platformDepositAddress || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setReady(true);
    }
  });

  const chainOptions = useMemo(() => {
    if (CHAIN_OPTIONS.some((option) => option.value === form.values.chainId) || !form.values.chainId) return CHAIN_OPTIONS;
    return [{ value: form.values.chainId, label: `Chain ${form.values.chainId}` }, ...CHAIN_OPTIONS];
  }, [form.values.chainId]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!form.validate()) return;
    setBusy(true);
    try {
      const data = await saveSettings({
        bscRpcUrl: form.values.bscRpcUrl.trim(),
        chainId: Number(form.values.chainId),
        usdtContract: form.values.usdtContract.trim(),
        gasFunderPrivateKey: form.values.gasFunderPrivateKey,
        clearGasFunder: form.values.clearGasFunder,
        chargeFlat: Number(form.values.chargeFlat),
        chargePercent: Number(form.values.chargePercent),
        platformDepositAddress: form.values.platformDepositAddress.trim(),
      });
      setSaved(data.settings);
      form.replace({
        ...form.values,
        gasFunderPrivateKey: '',
        clearGasFunder: false,
      });
      setNotice('Settings saved.');
      setCopied(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyGasWallet() {
    const address = saved?.gasFunderAddress;
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const input = document.createElement('textarea');
      input.value = address;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  if (!ready) return error ? <p className="error">{error}</p> : <FormSkeleton />;

  const replacing = Boolean(form.values.gasFunderPrivateKey.trim());
  const removing = form.values.clearGasFunder && !replacing;
  const configured = Boolean(saved?.gasFunderSet && saved?.gasFunderAddress);

  return (
    <motion.form className="card form-grid" noValidate onSubmit={onSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Field name="chargeFlat" label="Flat charge (USDT)" error={form.error('chargeFlat')}>
        <input
          inputMode="decimal"
          value={form.values.chargeFlat}
          onChange={(event) => form.setField('chargeFlat', event.target.value)}
          onBlur={() => form.blur('chargeFlat')}
          placeholder="0.50"
        />
      </Field>
      <Field name="chargePercent" label="Percent charge" error={form.error('chargePercent')}>
        <input
          inputMode="decimal"
          value={form.values.chargePercent}
          onChange={(event) => form.setField('chargePercent', event.target.value)}
          onBlur={() => form.blur('chargePercent')}
          placeholder="1"
        />
      </Field>
      <Field name="platformDepositAddress" label="Platform deposit address" className="form-span" error={form.error('platformDepositAddress')}>
        <input
          value={form.values.platformDepositAddress}
          onChange={(event) => form.setField('platformDepositAddress', event.target.value)}
          onBlur={() => form.blur('platformDepositAddress')}
          placeholder="0x address that receives charge-wallet top-ups"
          spellCheck="false"
        />
      </Field>
      <Field name="bscRpcUrl" label="BNB Smart Chain RPC" className="form-span" error={form.error('bscRpcUrl')}>
        <input
          value={form.values.bscRpcUrl}
          onChange={(event) => form.setField('bscRpcUrl', event.target.value)}
          onBlur={() => form.blur('bscRpcUrl')}
          placeholder="https://bsc-dataseed.binance.org/"
          spellCheck="false"
        />
      </Field>
      <Field name="chainId" label="Chain" error={form.error('chainId')}>
        <SearchSelect
          value={form.values.chainId}
          onChange={(value) => form.setField('chainId', value)}
          onBlur={() => form.blur('chainId')}
          options={chainOptions}
          placeholder="Choose a chain"
          searchPlaceholder="Search chains"
        />
      </Field>
      <Field name="usdtContract" label="USDT contract" error={form.error('usdtContract')}>
        <input
          value={form.values.usdtContract}
          onChange={(event) => form.setField('usdtContract', event.target.value)}
          onBlur={() => form.blur('usdtContract')}
          placeholder="0x55d398326f99059fF775485246999027B3197955"
          spellCheck="false"
        />
      </Field>
      <Field name="gasFunderPrivateKey" label="Gas funder private key" className="form-span" error={form.error('gasFunderPrivateKey')}>
        <input
          type="password"
          value={form.values.gasFunderPrivateKey}
          onChange={(event) => {
            form.setField('gasFunderPrivateKey', event.target.value);
            if (event.target.value.trim()) form.setField('clearGasFunder', false);
          }}
          onBlur={() => form.blur('gasFunderPrivateKey')}
          placeholder={saved?.gasFunderSet ? 'Leave blank to keep the current key' : 'Paste the gas wallet private key'}
          autoComplete="off"
        />
      </Field>
      <section className="gas-card form-span" aria-labelledby="gas-wallet-title">
        <div className="gas-card__top">
          <div>
            <p className="gas-card__label" id="gas-wallet-title">Gas wallet</p>
            <p className="gas-card__address mono">
              {removing ? 'Removed when you save' : configured ? saved.gasFunderAddress : 'Not configured'}
            </p>
          </div>
          <span className={`pill ${removing ? 'is-rejected' : replacing ? 'is-pending' : configured ? 'is-ok' : 'is-waiting'}`}>
            {removing ? 'Removing' : replacing ? 'Replacing' : configured ? 'Active' : 'Not set'}
          </span>
        </div>
        <div className="gas-card__actions">
          {configured && !removing && (
            <button type="button" className="ghost" onClick={copyGasWallet}>
              <HiOutlineDocumentDuplicate />
              {copied ? 'Copied' : 'Copy address'}
            </button>
          )}
          {configured && !removing && !replacing && (
            <button type="button" className="ghost danger" onClick={() => setConfirmRemove(true)}>
              <HiOutlineTrash />
              Remove
            </button>
          )}
          {removing && (
            <button type="button" className="ghost" onClick={() => form.setField('clearGasFunder', false)}>
              Undo
            </button>
          )}
        </div>
      </section>
      <Dialog
        open={confirmRemove}
        title="Remove this gas wallet?"
        tone="danger"
        icon={HiOutlineTrash}
        onClose={() => setConfirmRemove(false)}
      >
        <p className="secret-value mono">{saved?.gasFunderAddress}</p>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => setConfirmRemove(false)}>Cancel</button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              form.setField('clearGasFunder', true);
              form.setField('gasFunderPrivateKey', '');
              setConfirmRemove(false);
            }}
          >
            Remove on save
          </button>
        </div>
      </Dialog>
      {form.summary && <p className="form-alert form-span" role="alert">{form.summary}</p>}
      {error && <p className="form-alert form-span" role="alert">{error}</p>}
      {notice && <p className="form-alert is-ok form-span">{notice}</p>}
      <div className="actions form-span">
        <button type="submit" className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div>
    </motion.form>
  );
}
