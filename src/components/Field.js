import { cloneElement, useId } from 'react';

export default function Field({ name, label, error, hint, className = '', children }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const control = cloneElement(children, {
    id: children.props.id || id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    invalid: Boolean(error),
  });

  return (
    <div className={`field ${error ? 'is-invalid' : ''} ${className}`.trim()} data-field={name}>
      <label htmlFor={children.props.id || id}>{label}</label>
      {control}
      {hint && !error ? <p id={hintId} className="field__hint">{hint}</p> : null}
      {error ? <p id={errorId} className="field__error" role="alert">{error}</p> : null}
    </div>
  );
}
