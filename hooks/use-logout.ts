import { signOut } from '@/lib/session';

const logOut = () => signOut();
export const useLogout = () => ({ logOut });
