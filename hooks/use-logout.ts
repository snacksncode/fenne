import { TANSTACK_QUERY_CACHE_KEY } from '@/query-client';
import { useSession } from '@/contexts/session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { removeSessionToken } = useSession();
  const logOut = async () => {
    await AsyncStorage.removeItem(TANSTACK_QUERY_CACHE_KEY);
    removeSessionToken();
    queryClient.clear();
  };
  return { logOut };
};
