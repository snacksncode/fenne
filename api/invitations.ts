import { api } from '@/api';
import { UserDTO } from '@/api/auth';
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

export const invitationsOptions = queryOptions({
  queryKey: ['invitations'],
  queryFn: () => {
    return api.get<InvitationsDTO>('/invitations');
  },
  staleTime: Infinity,
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
    mutationFn: async () => api.post(`/invitations/${id}/accept`),
    onSettled: () => queryClient.invalidateQueries(),
  });
};

export const useDeclineInvite = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['declineInvite'],
    mutationFn: async () => api.post(`/invitations/${id}/decline`),
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

export const useRemoveSentInvite = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['removeSentInvite'],
    mutationFn: async () => api.delete(`/invitations/${id}`),
    onSettled: () => queryClient.invalidateQueries(invitationsOptions),
  });
};

export const useLeaveFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['leaveFamily'],
    mutationFn: async () => api.post('/leave_family'),
    onSettled: () => queryClient.invalidateQueries(),
  });
};
