import React, { useState, useCallback, useRef, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   Shared modal dialog (replaces SweetAlert everywhere).

   Usage inside a component:

     const { confirm, notify, dialogElement } = useDialog();

     const ok = await confirm({ title: 'Archive?', body: 'Are you sure?', tone: 'warning', confirmText: 'Yes, Archive' });
     if (ok) { ... }

     notify({ variant: 'success', title: 'Saved', timer: 1500 });   // auto-closes, no buttons
     notify({ variant: 'error', title: 'Failed', body: 'Try again.' });

     return (<> ...page... {dialogElement} </>);
   ───────────────────────────────────────────────────────────── */

const VARIANTS = {
  success: {
    wrap: 'bg-emerald-50 text-emerald-600',
    icon: <polyline points="20 6 9 17 4 12" />,
  },
  error: {
    wrap: 'bg-red-50 text-red-600',
    icon: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  },
  warning: {
    wrap: 'bg-amber-50 text-amber-600',
    icon: (
      <>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
  info: {
    wrap: 'bg-brand-soft text-brand',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
  },
};

const TONES = {
  brand: 'ui-btn-primary',
  danger: 'ui-btn bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700',
  warning: 'ui-btn bg-amber-600 text-white shadow-md shadow-amber-600/20 hover:bg-amber-700',
};

export function DialogModal({
  isOpen,
  variant = 'info',
  title,
  children,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  showConfirm = true,
  tone = 'brand',
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKey);
    confirmRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  const v = VARIANTS[variant] || VARIANTS.info;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand/20 backdrop-blur-md"
      onClick={() => onCancel?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="ui-card w-full max-w-md p-8 text-center shadow-2xl"
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${v.wrap}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {v.icon}
          </svg>
        </div>
        <h2 id="dialog-title" className="ui-page-title !text-xl mb-3">{title}</h2>
        {children && <div className="ui-body mb-6">{children}</div>}

        {(showConfirm || showCancel) && (
          <div className={`flex gap-3 ${children ? '' : 'mt-6'}`}>
            {showCancel && (
              <button type="button" onClick={onCancel} className="ui-btn-secondary flex-1">
                {cancelText}
              </button>
            )}
            {showConfirm && (
              <button ref={confirmRef} type="button" onClick={onConfirm} className={`${TONES[tone] || TONES.brand} flex-1`}>
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function useDialog() {
  const [cfg, setCfg] = useState(null);
  const resolveRef = useRef(null);
  const timerRef = useRef(null);

  const finish = useCallback((result) => {
    clearTimeout(timerRef.current);
    setCfg(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(result);
  }, []);

  const open = useCallback(
    (config) =>
      new Promise((resolve) => {
        clearTimeout(timerRef.current);
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setCfg(config);
        if (config.timer) timerRef.current = setTimeout(() => finish(true), config.timer);
      }),
    [finish]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Resolves true when confirmed, false when cancelled / dismissed
  const confirm = useCallback(
    (config) => open({ variant: 'warning', showCancel: true, showConfirm: true, ...config }),
    [open]
  );

  // Info / result popup. With `timer` it closes itself and shows no buttons.
  const notify = useCallback(
    (config) => open({ showCancel: false, showConfirm: !config.timer, ...config }),
    [open]
  );

  const dialogElement = (
    <DialogModal
      isOpen={!!cfg}
      variant={cfg?.variant}
      title={cfg?.title}
      confirmText={cfg?.confirmText}
      cancelText={cfg?.cancelText}
      showCancel={cfg?.showCancel}
      showConfirm={cfg?.showConfirm}
      tone={cfg?.tone}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    >
      {cfg?.body}
    </DialogModal>
  );

  return { confirm, notify, dialogElement };
}

export default DialogModal;