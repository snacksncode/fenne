import { QueryClient, QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { getISOWeekString } from '@/date-tools';

/** Local writes and Family broadcasts use the same affected-data policy. */
export type FamilyChange =
  | { resource: 'schedules'; data?: { dates?: string[] } | null }
  | { resource: 'products' | 'recipes' | 'grocery_items' | 'pantry_entries' | 'consumption_logs' | 'invitations' | 'family' | 'family_members' | 'checkout' | 'reconnect' };

export async function refreshFamilyData(client: QueryClient, change: FamilyChange): Promise<void> {
  let keys: readonly QueryKey[];
  switch (change.resource) {
    case 'reconnect':
      return client.invalidateQueries();
    case 'products':
      keys = [queryKeys.products.all(), queryKeys.recipes.all(), queryKeys.pantry.all(), queryKeys.groceries.all(), queryKeys.groceries.previews()];
      break;
    case 'recipes':
      keys = [queryKeys.recipes.all(), queryKeys.products.all(), queryKeys.schedules.all(), queryKeys.groceries.previews()];
      break;
    case 'checkout':
    case 'pantry_entries':
    case 'consumption_logs':
      keys = [queryKeys.pantry.all(), queryKeys.products.all(), queryKeys.groceries.all(), queryKeys.groceries.previews(), queryKeys.consumptionLogs.all()];
      break;
    case 'grocery_items':
      keys = [queryKeys.groceries.all(), queryKeys.groceries.previews()];
      break;
    case 'schedules':
      keys = [
        ...(change.data?.dates
          ? [...new Set(change.data.dates.map(getISOWeekString))].map(queryKeys.schedules.week)
          : [queryKeys.schedules.all()]),
        queryKeys.groceries.previews(),
      ];
      break;
    case 'invitations':
      keys = [queryKeys.invitations.all()];
      break;
    case 'family':
    case 'family_members':
      keys = [queryKeys.auth.currentUser()];
      break;
    default:
      return;
  }
  // Never skip an event because a fetch is running: it may contain an older snapshot.
  await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
