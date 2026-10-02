import { useGenerateGroceryItems } from '@/api/groceries';
import { GroceryPreviewDTO } from '@/api/types';
import { atom, createStore, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

type GenerationDraft = {
  selected: Set<string>;
  overrides: Record<string, number | null>;
  editing: Set<string>;
};

type DraftAction =
  | { type: 'toggle'; id: string }
  | { type: 'quantity'; id: string; quantity: number | null }
  | { type: 'editing'; id: string; editing: boolean };

const draftAtom = atom<GenerationDraft>({ selected: new Set<string>(), overrides: {}, editing: new Set<string>() });
const editingAtom = atom((get) => get(draftAtom).editing.size > 0);
const changeDraftAtom = atom(null, (get, set, action: DraftAction) => {
  const draft = get(draftAtom);
  if (action.type === 'quantity') {
    set(draftAtom, { ...draft, overrides: { ...draft.overrides, [action.id]: action.quantity } });
  } else if (action.type === 'toggle') {
    const selected = new Set(draft.selected);
    if (selected.has(action.id)) selected.delete(action.id); else selected.add(action.id);
    set(draftAtom, { ...draft, selected });
  } else {
    if (draft.editing.has(action.id) === action.editing) return;
    const editing = new Set(draft.editing);
    if (action.editing) editing.add(action.id); else editing.delete(action.id);
    set(draftAtom, { ...draft, editing });
  }
});

/** The caller scopes this store to one date-range review with Jotai's Provider. */
export const useGenerationDraftStore = (preview: GroceryPreviewDTO) => useState(() => {
  const store = createStore();
  store.set(draftAtom, {
    selected: new Set(preview.products.filter((row) => row.checked).map((row) => row.product_id)),
    overrides: {},
    editing: new Set<string>(),
  });
  return store;
})[0];

export const useGenerationProductDraft = (id: string) => {
  const checked = useAtomValue(useMemo(() => atom((get) => get(draftAtom).selected.has(id)), [id]));
  const override = useAtomValue(useMemo(() => atom((get) => get(draftAtom).overrides[id]), [id]));
  const change = useSetAtom(changeDraftAtom);
  useEffect(() => () => change({ type: 'editing', id, editing: false }), [change, id]);
  return {
    checked,
    override,
    toggle: () => change({ type: 'toggle', id }),
    setQuantity: (quantity: number | null) => change({ type: 'quantity', id, quantity }),
    setEditing: (editing: boolean) => change({ type: 'editing', id, editing }),
  };
};

export const useGenerationSubmission = ({ preview, start, end, onSuccess }: {
  preview: GroceryPreviewDTO;
  start: string;
  end: string;
  onSuccess: () => void;
}) => {
  const store = useStore();
  const editing = useAtomValue(editingAtom);
  const mutation = useGenerateGroceryItems();
  const submit = () => {
    const draft = store.get(draftAtom);
    if (draft.editing.size || mutation.isPending) return;
    const selected = preview.products.filter((row) => draft.selected.has(row.product_id)).map((row) => row.product_id);
    mutation.mutate({
      start,
      end,
      checked_product_ids: selected,
      purchase_quantities: Object.entries(draft.overrides)
        .filter(([id]) => selected.includes(id))
        .map(([product_id, quantity]) => ({ product_id, quantity })),
    }, { onSuccess });
  };
  return { submit, editing, saving: mutation.isPending, failed: mutation.isError };
};
