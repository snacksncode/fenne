import { produce, Producer } from 'immer';
import { nanoid } from 'nanoid/non-secure';
import { useQueryClient, InferDataFromTag, AnyDataTag, dataTagSymbol, Updater } from '@tanstack/react-query';

export const tempId = () => `temp-${nanoid()}`;

export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  async function update<
    TaggedQueryKey extends readonly unknown[] & AnyDataTag,
    TData = TaggedQueryKey[typeof dataTagSymbol],
  >({ queryKey, updateFn }: { queryKey: TaggedQueryKey; updateFn: Producer<TData> }) {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (old) => produce(old, updateFn));
    return { previousData };
  }

  function revert<TaggedQueryKey extends readonly unknown[] & AnyDataTag>({
    queryKey,
    previousData,
  }: {
    queryKey: TaggedQueryKey;
    previousData: Updater<
      InferDataFromTag<unknown, TaggedQueryKey> | undefined,
      InferDataFromTag<unknown, TaggedQueryKey> | undefined
    >;
  }) {
    if (previousData !== undefined) {
      queryClient.setQueryData(queryKey, previousData);
    }
  }

  return { update, revert };
}
