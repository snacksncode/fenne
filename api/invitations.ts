import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { UserDTO } from '@/api/auth';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';

const refreshInvitations = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'invitations' });

const refreshFamily = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'family' });

export const invitationsRequests = {
  getAll: () => {
    return client.get<InvitationsDTO>('/invitations');
  },
  post: (data: { email: string }) => {
    return client.post('/invitations', data);
  },
  accept: (data: { id: string }) => {
    return client.post(`/invitations/${data.id}/accept`);
  },
  decline: (data: { id: string }) => {
    return client.post(`/invitations/${data.id}/decline`);
  },
  remove: (data: { id: string }) => {
    return client.delete(`/invitations/${data.id}`);
  },
  leaveFamily: () => {
    return client.post('/leave_family');
  },
};

export type InvitationDTO = {
  id: string;
  from_user: UserDTO;
  to_user: UserDTO;
};

export type InvitationsDTO = {
  sent: InvitationDTO[];
  received: InvitationDTO[];
};

export const invitationsQuery = queryOptions({
  queryKey: queryKeys.invitations.all(),
  queryFn: invitationsRequests.getAll,
  staleTime: Infinity,
});

export const useInvitations = () => {
  return useQuery(invitationsQuery);
};

export const postInviteMutation = {
  meta: { persist: true },
  mutationKey: ['postInvite'],
  mutationFn: invitationsRequests.post,
  onSettled: refreshInvitations,
};

queryClient.setMutationDefaults(postInviteMutation.mutationKey, postInviteMutation);

export const usePostInvite = () => useMutation(postInviteMutation);

export const acceptInviteMutation = {
  mutationKey: ['acceptInvite'],
  mutationFn: invitationsRequests.accept,
  networkMode: 'always' as const,
  onSettled: refreshFamily,
};

export const useAcceptInvite = () => useMutation(acceptInviteMutation);

export const declineInviteMutation = {
  meta: { persist: true },
  mutationKey: ['declineInvite'],
  mutationFn: invitationsRequests.decline,
  onSettled: refreshInvitations,
};

queryClient.setMutationDefaults(declineInviteMutation.mutationKey, declineInviteMutation);

export const useDeclineInvite = () => useMutation(declineInviteMutation);

export const removeSentInviteMutation = {
  meta: { persist: true },
  mutationKey: ['removeSentInvite'],
  mutationFn: invitationsRequests.remove,
  onSettled: refreshInvitations,
};

queryClient.setMutationDefaults(removeSentInviteMutation.mutationKey, removeSentInviteMutation);

export const useRemoveSentInvite = () => useMutation(removeSentInviteMutation);

export const leaveFamilyMutation = {
  mutationKey: ['leaveFamily'],
  mutationFn: invitationsRequests.leaveFamily,
  networkMode: 'always' as const,
  onSettled: refreshFamily,
};

export const useLeaveFamily = () => useMutation(leaveFamilyMutation);
