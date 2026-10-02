import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useEditGroceryChecks, GroceryCheck } from '@/api/groceries';
import { GroceryItemDTO } from '@/api/types';

export const useGroceryChecks = () => {
  const { mutateAsync } = useEditGroceryChecks();
  const queued = useRef(new Map<string, GroceryCheck>());
  const saving = useRef(new Set<string>());
  const inFlight = useRef(new Set<Promise<boolean>>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [checks, setChecks] = useState<Record<string, GroceryCheck>>({});
  const [error, setError] = useState(false);
  const [, refresh] = useState(0);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const batch = [...queued.current.values()];
    queued.current.clear();
    if (batch.length) {
      batch.forEach(({ id }) => saving.current.add(id));
      refresh((value) => value + 1);
      const save = (async () => {
        try {
          await mutateAsync(batch);
          return true;
        } catch {
          setError(true);
          return false;
        } finally {
          batch.forEach(({ id }) => saving.current.delete(id));
          setChecks((current) => {
            const next = { ...current };
            batch.forEach(({ id }) => delete next[id]);
            return next;
          });
        }
      })();
      inFlight.current.add(save);
      void save.then(() => inFlight.current.delete(save));
    }
    // Checkout and navigation may arrive while a previous burst is still saving.
    const results = await Promise.all([...inFlight.current]);
    return results.every(Boolean);
  }, [mutateAsync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void flush();
    });
    return () => {
      subscription.remove();
      void flush();
    };
  }, [flush]);

  const cancel = (id: string) => {
    queued.current.delete(id);
    if (!queued.current.size) clearTimeout(timer.current);
    setChecks((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const toggle = (item: GroceryItemDTO) => {
    if (saving.current.has(item.id)) return;
    setError(false);
    const current = queued.current.get(item.id)?.status ?? item.status;
    const status = current === 'completed' ? 'pending' : 'completed';
    clearTimeout(timer.current);
    if (status === item.status) {
      cancel(item.id);
    } else {
      const check: GroceryCheck = { id: item.id, status, ...(status === 'completed' ? { quantity: item.quantity } : {}) };
      queued.current.set(item.id, check);
      setChecks((previous) => ({ ...previous, [item.id]: check }));
    }
    if (queued.current.size) timer.current = setTimeout(() => void flush(), 500);
  };

  return { checks, toggle, cancel, flush, error, isSaving: (id: string) => saving.current.has(id), hasPending: Object.keys(checks).length > 0 };
};
