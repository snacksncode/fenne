import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { refreshFamilyData } from '@/lib/family-data';
import { queryKeys } from './query-keys';
import { getISOWeekString } from '@/date-tools';

it('repairs every Checkout dependency and both Recipe caches after Product changes', async () => {
  const client = new QueryClient();
  const keys = [queryKeys.pantry.all(), queryKeys.groceries.all(), queryKeys.groceries.preview('start', 'end'), queryKeys.products.catalog('family'), queryKeys.recipes.all(), queryKeys.recipes.detail('recipe')];
  keys.forEach((key) => client.setQueryData(key, []));
  await refreshFamilyData(client, { resource: 'checkout' });
  expect(client.getQueryState(queryKeys.pantry.all())?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.groceries.all())?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.groceries.preview('start', 'end'))?.isInvalidated).toBe(true);
  await refreshFamilyData(client, { resource: 'products' });
  for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  client.clear();
});

it('targets changed Schedule weeks and refreshes all data after reconnect', async () => {
  const client = new QueryClient();
  const changedWeek = queryKeys.schedules.week(getISOWeekString('2026-09-30'));
  const otherWeek = queryKeys.schedules.week(getISOWeekString('2026-10-14'));
  client.setQueryData(changedWeek, []);
  client.setQueryData(otherWeek, []);
  await refreshFamilyData(client, { resource: 'schedules', data: { dates: ['2026-09-30', '2026-10-01'] } });
  expect(client.getQueryState(changedWeek)?.isInvalidated).toBe(true);
  expect(client.getQueryState(otherWeek)?.isInvalidated).toBe(false);
  await refreshFamilyData(client, { resource: 'reconnect' });
  expect(client.getQueryState(otherWeek)?.isInvalidated).toBe(true);
  client.clear();
});

it('does not drop a Family event during an older in-flight refresh', async () => {
  const client = new QueryClient();
  const queryKey = queryKeys.groceries.all();
  client.setQueryData(queryKey, ['cached']);
  let finishOld!: (value: string[]) => void;
  const queryFn = jest.fn().mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; })).mockResolvedValue(['fresh']);
  const observer = new QueryObserver(client, { queryKey, queryFn });
  const unsubscribe = observer.subscribe(() => {});
  expect(queryFn).toHaveBeenCalledTimes(1);
  await refreshFamilyData(client, { resource: 'grocery_items' });
  finishOld(['old snapshot']);
  await Promise.resolve();
  expect(queryFn).toHaveBeenCalledTimes(2);
  expect(client.getQueryData(queryKey)).toEqual(['fresh']);
  unsubscribe();
  client.clear();
});
