import { api } from '@/api';
import { UserDTO } from '@/api/auth';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/query-client';

export type InvitationDTO = {
  id: string;
  from_user: UserDTO;
  to_user: UserDTO;
};

export type InvitationsDTO = {
  sent: InvitationDTO[];
  received: InvitationDTO[];
};

export const invitationsOptions = queryOptions({
  queryKey: ['invitations'],
  queryFn: api.invitations.getAll,
  staleTime: Infinity,
});

export const useInvitations = () => {
  return useQuery(invitationsOptions);
};

queryClient.setMutationDefaults(['postInvite'], { mutationFn: api.invitations.post });
export const usePostInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['postInvite'],
    mutationFn: api.invitations.post,
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

queryClient.setMutationDefaults(['acceptInvite'], { mutationFn: api.invitations.accept });
export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['acceptInvite'],
    mutationFn: api.invitations.accept,
    onSettled: () => queryClient.invalidateQueries(),
  });
};

queryClient.setMutationDefaults(['declineInvite'], { mutationFn: api.invitations.decline });
export const useDeclineInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['declineInvite'],
    mutationFn: api.invitations.decline,
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

queryClient.setMutationDefaults(['removeSentInvite'], { mutationFn: api.invitations.remove });
export const useRemoveSentInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['removeSentInvite'],
    mutationFn: api.invitations.remove,
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

queryClient.setMutationDefaults(['leaveFamily'], { mutationFn: api.invitations.leaveFamily });
export const useLeaveFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['leaveFamily'],
    mutationFn: api.invitations.leaveFamily,
    onSettled: () => queryClient.invalidateQueries(),
  });
};
