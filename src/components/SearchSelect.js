import { useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineChevronDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

export default function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search options',
  id,
  invalid = false,
  onBlur,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  return (
    <div className={`search-select ${open ? 'is-open' : ''}`} ref={rootRef} aria-invalid={ariaInvalid || undefined}>
      <button
        id={id}
        type="button"
        className={`search-select__button ${invalid ? 'is-invalid' : ''}`}
        aria-expanded={open}
        aria-describedby={ariaDescribedBy}
        onBlur={onBlur}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? '' : 'muted'}>{selected ? selected.label : placeholder}</span>
        <HiOutlineChevronDown />
      </button>
      {open && (
        <div className="search-select__menu">
          <div className="search-select__search">
            <HiOutlineMagnifyingGlass />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
          <ul>
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={String(option.value) === String(value) ? 'is-on' : ''}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="search-select__empty">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
