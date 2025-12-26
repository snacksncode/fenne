import { api } from '@/api';
import { useSession } from '@/contexts/session';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

export type UserDTO = {
  email: string;
  id: string;
  name: string;
};

type FamilyDTO = {
  id: string;
  members: UserDTO[];
};

export type CurrentUserDTO = {
  user: UserDTO;
  family: FamilyDTO;
};

export type AuthResponse = { status: 'success'; session_token: string } | { status: 'error'; error: string };

export const useLogin = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    mutationKey: ['logIn'],
    mutationFn: api.auth.login,
    onSuccess: (response) => {
      if (response.status === 'success') setSessionToken(response.session_token);
    },
  });
};

export const useSignup = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    mutationKey: ['signUp'],
    mutationFn: api.auth.signup,
    onSuccess: (response) => {
      if (response.status === 'success') setSessionToken(response.session_token);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationKey: ['changePassword'],
    mutationFn: api.auth.changePassword,
  });
};

export const currentUserOptions = queryOptions({
  queryKey: ['currentUser'],
  queryFn: api.auth.getCurrentUser,
  staleTime: Infinity,
});

export const useCurrentUser = () => {
  return useQuery(currentUserOptions);
};
