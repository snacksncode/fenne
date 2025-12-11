import { api } from '@/api';
import { currentUserOptions, UserDTO } from '@/api/auth';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type InvitationDTO = {
  id: string;
  from_user: UserDTO;
  to_user: UserDTO;
};

type InvitationsDTO = {
  sent: InvitationDTO[];
  received: InvitationDTO[];
};

const invitationsOptions = queryOptions({
  queryKey: ['invitations'],
  queryFn: () => {
    return api.get<InvitationsDTO>('/invitations');
  },
});

export const useInvitations = () => {
  return useQuery(invitationsOptions);
};

export const usePostInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['postInvite'],
    mutationFn: async ({ email }: { email: string }) => {
      return api.post('/invitations', { email });
    },
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

export const useAcceptInvite = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['acceptInvite'],
    mutationFn: async () => {
      return api.post(`/invitations/${id}/accept`);
    },
    onSettled: () => queryClient.invalidateQueries(),
  });
};

export const useDeclineInvite = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['declineInvite'],
    mutationFn: async () => {
      return api.post(`/invitations/${id}/decline`);
    },
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

export const useRemoveSentInvite = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['removeSentInvite'],
    mutationFn: async () => {
      return api.delete(`/invitations/${id}`);
    },
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};
