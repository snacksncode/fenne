import { useDeleteGroceryItem, useGroceryCheckout } from '@/api/groceries';
import { GroceryItemDTO } from '@/api/types';
import { useGroceryChecks } from '@/hooks/use-grocery-checks';
import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

// A single queue belongs to the mounted Grocery List, shared by its row hooks.
export const GroceryWorkflowContext = createContext<ReturnType<typeof useGroceryChecks> | null>(null);

export const useGroceryWorkflow = () => {
  const entries = useGroceryChecks();
  const { flush } = entries;
  const mutation = useGroceryCheckout();
  const checkingOut = useRef(false);
  const [waitingForChecks, setWaitingForChecks] = useState(false);
  useFocusEffect(useCallback(() => () => { void flush(); }, [flush]));

  const checkout = async () => {
    if (checkingOut.current) return;
    checkingOut.current = true;
    setWaitingForChecks(true);
    try {
      if (await flush()) await mutation.mutateAsync();
    } catch {
      // The mutation's error state is displayed by the Grocery List.
    } finally {
      checkingOut.current = false;
      setWaitingForChecks(false);
    }
  };

  return {
    entries,
    checkout,
    saving: waitingForChecks || mutation.isPending,
    checkError: entries.error,
    checkoutError: mutation.isError,
    checksPending: entries.hasPending,
  };
};

export const useGroceryEntry = (item: GroceryItemDTO) => {
  const checks = useContext(GroceryWorkflowContext);
  if (!checks) throw new Error('Grocery rows must be inside the Grocery List workflow');
  const removal = useDeleteGroceryItem();
  return {
    completed: (checks.checks[item.id]?.status ?? item.status) === 'completed',
    busy: checks.isSaving(item.id) || removal.isPending,
    canEdit: !checks.checks[item.id] && !removal.isPending,
    removeFailed: removal.isError,
    toggle: () => checks.toggle(item),
    remove: () => {
      checks.cancel(item.id);
      removal.mutate({ id: item.id });
    },
  };
};
