import { Children, cloneElement, isValidElement, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

function classNames(value) {
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
}

function isActions(node) {
  return isValidElement(node) && classNames(node.props?.className).includes('actions');
}

function splitDialog(children) {
  const items = Children.toArray(children);
  if (!items.length) return { body: null, footer: null, frame: null };
  const last = items[items.length - 1];
  if (isActions(last)) {
    const rest = items.slice(0, -1);
    return { body: rest.length ? rest : null, footer: last, frame: null };
  }
  if (items.length === 1 && isValidElement(last) && (last.type === 'form' || last.type === Symbol.for('react.fragment'))) {
    const inner = splitDialog(last.props.children);
    if (!inner.footer || inner.frame) return { body: items, footer: null, frame: null };
    if (last.type !== 'form') return inner;
    const frameChildren = [
      inner.body ? <div className="modal__body" key="body">{inner.body}</div> : null,
      <footer className="modal__foot" key="foot">{inner.footer}</footer>,
    ];
    return {
      body: null,
      footer: null,
      frame: cloneElement(
        last,
        { className: [...classNames(last.props.className), 'modal__frame'].join(' ') },
        frameChildren
      ),
    };
  }
  return { body: items, footer: null, frame: null };
}

export default function Dialog({ open, title, onClose, children, tone = 'accent', icon: Icon, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const parts = splitDialog(children);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-layer"
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.article
            className={`card modal is-${tone}${wide ? ' is-wide' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <header className="modal__head">
              {Icon ? (
                <span className="modal__badge">
                  <Icon />
                </span>
              ) : null}
              {title ? <h2 id="dialog-title">{title}</h2> : null}
            </header>
            {parts.frame || (
              <>
                {parts.body ? <div className="modal__body">{parts.body}</div> : null}
                {parts.footer ? <footer className="modal__foot">{parts.footer}</footer> : null}
              </>
            )}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
