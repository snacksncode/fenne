import { api } from '@/api';
import { useSession } from '@/contexts/session';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

type LoginData = {
  email: string;
  password: string;
};

type SignupData = {
  name: string;
  email: string;
  password: string;
};

type ChangePasswordData = {
  current_password: string;
  new_password: string;
};

export type UserDTO = {
  email: string;
  id: string;
  name: string;
};

type FamilyDTO = {
  id: string;
  members: UserDTO[];
};

type CurrentUserDTO = {
  user: UserDTO;
  family: FamilyDTO;
};

type AuthResponse = { status: 'success'; session_token: string } | { status: 'error'; error: string };

export const useLogin = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    mutationKey: ['logIn'],
    mutationFn: async ({ email, password }: LoginData) => {
      const response = await api.post<AuthResponse>('/login', { email, password });
      if (response.status === 'success') setSessionToken(response.session_token);
    },
  });
};

export const useSignup = () => {
  const { setSessionToken } = useSession();
  return useMutation({
    mutationKey: ['signUp'],
    mutationFn: async ({ name, email, password }: SignupData) => {
      const response = await api.post<AuthResponse>('/signup', { name, email, password });
      if (response.status === 'success') setSessionToken(response.session_token);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationKey: ['changePassword'],
    mutationFn: async ({ current_password, new_password }: ChangePasswordData) => {
      return api.post('/change_password', { current_password, new_password });
    },
  });
};

export const currentUserOptions = queryOptions({
  queryKey: ['currentUser'],
  queryFn: async () => {
    return api.get<CurrentUserDTO>('/me');
  },
  staleTime: Infinity,
});

export const useCurrentUser = () => {
  return useQuery(currentUserOptions);
};
