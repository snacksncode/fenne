import { UserDTO } from '@/api/auth';

export const isGuest = (user: UserDTO | undefined): boolean => {
  if (!user) return false;
  return user.email.endsWith('@fenneplanner.com');
};
