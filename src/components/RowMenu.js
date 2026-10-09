import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineBars3 } from 'react-icons/hi2';

export default function RowMenu({ label = 'Actions', children }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  function close() {
    setOpen(false);
  }

  useLayoutEffect(() => {
    if (!open) return undefined;

    function place() {
      const button = buttonRef.current;
      const panel = panelRef.current;
      if (!button || !panel) return;
      const rect = button.getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      const gap = 8;
      let left = rect.left - box.width - gap;
      if (left < 8) left = Math.min(rect.right + gap, window.innerWidth - box.width - 8);
      let top = rect.top + (rect.height - box.height) / 2;
      top = Math.max(8, Math.min(top, window.innerHeight - box.height - 8));
      setPosition({ top, left });
    }

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (buttonRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.top, left: Math.max(8, rect.left - 220) });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`icon-btn${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <HiOutlineBars3 />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              className="row-menu"
              role="menu"
              aria-label={label}
              style={{ top: position.top, left: position.left }}
              initial={{ opacity: 0, x: 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <div className="menu-actions">
                {typeof children === 'function' ? children(close) : children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
