import { api } from '@/api';
import { useSession } from '@/contexts/session';
import { useLogout } from '@/hooks/use-logout';
import { useOptimisticUpdate } from '@/api/optimistic';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useEffect } from 'react';

export type UserDTO = {
  email: string;
  id: string;
  name: string;
};

export type UnitPreference = 'metric' | 'imperial';

export type FamilyDTO = {
  id: string;
  unit_preference: UnitPreference;
  timezone: string | null;
  members: UserDTO[];
};

export type CurrentUserDTO = {
  user: UserDTO;
  family: FamilyDTO;
};

export type AuthResponse = { session_token: string };

export const useLogin = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    mutationKey: ['logIn'],
    mutationFn: api.auth.login,
    onSuccess: (response) => {
      setSessionToken(response.session_token);
    },
  });
};

export const useDeleteAccount = () => {
  const { logOut } = useLogout();
  return useMutation({
    mutationKey: ['deleteAccount'],
    mutationFn: api.auth.deleteAccount,
    onSuccess: logOut,
  });
};

export const useLoginAsGuest = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    mutationKey: ['logInAsGuest'],
    mutationFn: api.auth.loginAsGuest,
    onSuccess: (response) => {
      setSessionToken(response.session_token);
    },
  });
};

export const useConvertGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['convertGuest'],
    mutationFn: api.auth.convertGuest,
    onSuccess: () => queryClient.invalidateQueries(currentUserOptions),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationKey: ['changePassword'],
    mutationFn: api.auth.changePassword,
  });
};

export const useChangeDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['changeDetails'],
    mutationFn: api.auth.changeDetails,
    onSuccess: () => queryClient.invalidateQueries(currentUserOptions),
  });
};

export const currentUserOptions = queryOptions({
  queryKey: queryKeys.auth.currentUser(),
  queryFn: api.auth.getCurrentUser,
  staleTime: Infinity,
});

export const useCurrentUser = () => {
  const { token } = useSession();
  return useQuery({ ...currentUserOptions, enabled: !!token });
};

export const useUpdateFamilyPreferences = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateFamilyPreferences'],
    mutationFn: api.family.updatePreferences,
    onMutate: async (newPrefs) => {
      const { previousData } = await update({
        queryKey: currentUserOptions.queryKey,
        updateFn: (state) => {
          if (state && newPrefs.unit_preference) state.family.unit_preference = newPrefs.unit_preference;
          if (state && 'timezone' in newPrefs) state.family.timezone = newPrefs.timezone ?? null;
        },
      });
      return { previousData, queryKey: currentUserOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => {
      queryClient.invalidateQueries(currentUserOptions);
    },
  });
};

const deviceTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone || null;
};

export const useEnsureFamilyTimezone = () => {
  const currentUser = useCurrentUser();
  const updatePreferences = useUpdateFamilyPreferences();

  useEffect(() => {
    if (!currentUser.data || currentUser.data.family.timezone || updatePreferences.isPending) return;

    const timezone = deviceTimezone();
    if (!timezone) return;

    updatePreferences.mutate({ timezone });
  }, [currentUser.data, updatePreferences]);
};
