import type { MutationFunctionContext } from '@tanstack/react-query';
import { resetFamilyData, signOut } from '@/lib/session';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { useSession } from '@/contexts/session';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useEffect } from 'react';

export const familyRequests = {
  updatePreferences: (data: { timezone?: string | null }) => {
    return client.patch('/family/preferences', data);
  },
};

export const authRequests = {
  login: (data: { email: string; password: string }) => {
    return client.post<AuthResponse>('/login', data);
  },
  loginAsGuest: () => {
    return client.post<AuthResponse>('/guest');
  },
  convertGuest: (data: { name: string; email: string; password: string }) => {
    return client.post('/convert_guest', data);
  },
  getCurrentUser: () => {
    return client.get<CurrentUserDTO>('/me');
  },
  changePassword: (data: { current_password: string; new_password: string }) => {
    return client.post('/change_password', data);
  },
  changeDetails: (data: { name?: string; email?: string }) => {
    return client.post('/change_details', data);
  },
  deleteAccount: () => {
    return client.delete('/delete_account');
  },
};

export type UserDTO = {
  email: string;
  id: string;
  name: string;
};

export type FamilyDTO = {
  id: string;
  timezone: string | null;
  members: UserDTO[];
};

export type CurrentUserDTO = {
  user: UserDTO;
  family: FamilyDTO;
};

export type AuthResponse = { session_token: string };

export const loginMutation = {
  mutationKey: ['logIn'],
  mutationFn: authRequests.login,
  networkMode: 'always' as const,
};

export const useLogin = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    ...loginMutation,
    onSuccess: (response) => {
      return setSessionToken(response.session_token);
    },
  });
};

export const deleteAccountMutation = {
  mutationKey: ['deleteAccount'],
  mutationFn: authRequests.deleteAccount,
  networkMode: 'always' as const,
};

export const useDeleteAccount = () => {
  return useMutation({
    ...deleteAccountMutation,
    onSuccess: () => signOut(),
  });
};

export const loginAsGuestMutation = {
  mutationKey: ['logInAsGuest'],
  mutationFn: authRequests.loginAsGuest,
  networkMode: 'always' as const,
};

export const useLoginAsGuest = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    ...loginAsGuestMutation,
    onSuccess: (response) => {
      return setSessionToken(response.session_token);
    },
  });
};

const refreshCurrentUser = (
  _data: unknown, _variables: unknown, _result: unknown, { client }: MutationFunctionContext,
) => client.invalidateQueries(currentUserQuery);

export const convertGuestMutation = {
  mutationKey: ['convertGuest'],
  mutationFn: authRequests.convertGuest,
  networkMode: 'always' as const,
  onSuccess: refreshCurrentUser,
};

export const useConvertGuest = () => useMutation(convertGuestMutation);

export const changePasswordMutation = {
  mutationKey: ['changePassword'],
  mutationFn: authRequests.changePassword,
  networkMode: 'always' as const,
};

export const useChangePassword = () => useMutation(changePasswordMutation);

export const changeDetailsMutation = {
  mutationKey: ['changeDetails'],
  mutationFn: authRequests.changeDetails,
  networkMode: 'always' as const,
  onSuccess: refreshCurrentUser,
};

export const useChangeDetails = () => useMutation(changeDetailsMutation);

export const currentUserQuery = queryOptions({
  queryKey: queryKeys.auth.currentUser(),
  queryFn: async ({ client }) => {
    const previous = client.getQueryData<CurrentUserDTO>(queryKeys.auth.currentUser());
    const current = await authRequests.getCurrentUser();
    if (previous && previous.family.id !== current.family.id) await resetFamilyData(client, current);
    return current;
  },
  staleTime: Infinity,
});

export const useCurrentUser = () => {
  const { token } = useSession();
  return useQuery({ ...currentUserQuery, enabled: !!token });
};

export const updateFamilyPreferencesMutation = {
  mutationKey: ['updateFamilyPreferences'],
  mutationFn: familyRequests.updatePreferences,
  networkMode: 'always' as const,
  onSuccess: (_data: unknown, _variables: unknown, _result: unknown, { client }: MutationFunctionContext) => refreshFamilyData(client, { resource: 'family' }),
};

export const useUpdateFamilyPreferences = () => useMutation(updateFamilyPreferencesMutation);

const deviceTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone || null;
};

export const useEnsureFamilyTimezone = () => {
  const currentUser = useCurrentUser();
  const updatePreferences = useUpdateFamilyPreferences();

  useEffect(() => {
    if (!currentUser.data || currentUser.data.family.timezone || updatePreferences.isPending || updatePreferences.isError) return;

    const timezone = deviceTimezone();
    if (!timezone) return;

    updatePreferences.mutate({ timezone });
  }, [currentUser.data, updatePreferences]);
};
