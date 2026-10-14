import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Tiny global "unsaved changes" guard.
 * - Pages report whether they are dirty via useUnsavedChanges(isDirty).
 * - Anything that leaves the page (sidebar links, Back/Cancel buttons, Sign Out)
 *   calls requestLeave(proceed). If the page is dirty, a confirmation modal is
 *   shown first (rendered once, inside the sidebar) and `proceed` only runs
 *   when the user chooses "Leave anyway".
 * - Closing / refreshing the tab is covered by the browser's beforeunload prompt.
 */

let dirty = false;
let pending = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const hasUnsavedChanges = () => dirty;
export const clearUnsavedChanges = () => { dirty = false; };

export function requestLeave(proceed) {
  if (!dirty) {
    proceed();
    return;
  }
  pending = proceed;
  emit();
}

export function confirmLeave() {
  const action = pending;
  pending = null;
  emit();
  if (action) action();
}

export function cancelLeave() {
  pending = null;
  emit();
}

/** Used by the modal to know when to show. */
export function usePendingLeave() {
  const [isPending, setIsPending] = useState(pending !== null);
  useEffect(() => {
    const sync = () => setIsPending(pending !== null);
    listeners.add(sync);
    return () => listeners.delete(sync);
  }, []);
  return isPending;
}

/** Call from any page: useUnsavedChanges(someBoolean) */
export function useUnsavedChanges(isDirty) {
  useEffect(() => {
    dirty = isDirty;
    if (!isDirty) return undefined;

    const handler = (e) => {
      if (!dirty) return; // cleared on purpose (e.g. after save / logout)
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Page unmounted -> nothing left to protect
  useEffect(() => () => { dirty = false; }, []);
}

/** Drop-in replacement for navigate() that asks first when there are unsaved changes. */
export function useGuardedNavigate() {
  const navigate = useNavigate();
  return useCallback((to, options) => requestLeave(() => navigate(to, options)), [navigate]);
}