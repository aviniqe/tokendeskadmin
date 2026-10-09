import { useRef, useState } from 'react';
import { collect } from '../lib/validators';

export function useForm(initialValues, rules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [summary, setSummary] = useState('');
  const rulesRef = useRef(rules);
  const valuesRef = useRef(initialValues);
  const touchedRef = useRef({});
  const attemptedRef = useRef(false);
  rulesRef.current = rules;

  function messageFor(name, value, source) {
    const rule = rulesRef.current[name];
    if (!rule) return '';
    return rule(value, source) || '';
  }

  function setField(name, value) {
    const source = { ...valuesRef.current, [name]: value };
    valuesRef.current = source;
    setValues(source);
    setSummary('');
    if (!errors[name] && !touchedRef.current[name] && !attemptedRef.current) return;
    const message = messageFor(name, value, source);
    setErrors((current) => {
      if (!message && !current[name]) return current;
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function blur(name) {
    touchedRef.current = { ...touchedRef.current, [name]: true };
    setTouched(touchedRef.current);
    const source = valuesRef.current;
    const message = messageFor(name, source[name], source);
    setErrors((current) => {
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function error(name) {
    if (!attempted && !touched[name]) return '';
    return errors[name] || '';
  }

  function validate() {
    const next = collect(rulesRef.current, valuesRef.current);
    setErrors(next);
    attemptedRef.current = true;
    setAttempted(true);
    const names = Object.keys(next);
    setSummary(names.length ? 'Please correct the highlighted fields.' : '');
    if (names[0]) {
      const node = document.querySelector(`[data-field="${names[0]}"]`);
      node?.querySelector('input, textarea, select, button')?.focus();
    }
    return names.length === 0;
  }

  function replace(nextValues) {
    valuesRef.current = nextValues;
    touchedRef.current = {};
    attemptedRef.current = false;
    setValues(nextValues);
    setErrors({});
    setTouched({});
    setAttempted(false);
    setSummary('');
  }

  return { values, setField, blur, error, validate, summary, setSummary, replace };
}
