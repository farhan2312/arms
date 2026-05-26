import { type ReactNode, createContext, useContext, useMemo, useState } from 'react';
import type { User, UserRole } from '../types/roles';
import type { Store } from '../types/entities';
import { MOCK_USERS } from '../data/mockUsers';
import { mockStores } from '../data/mockStores';

interface AuthContextValue {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  hasRole: (roles: UserRole[]) => boolean;
  allUsers: User[];
  /** The primary store for the current user (first assignedStoreId), or undefined for platform-wide roles. */
  currentStore: Store | undefined;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  const hasRole = (roles: UserRole[]): boolean => roles.includes(currentUser.role);

  const currentStore = useMemo<Store | undefined>(() => {
    const storeId = currentUser.assignedStoreIds[0];
    return storeId ? mockStores.find((s) => s.id === storeId) : undefined;
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, hasRole, allUsers: MOCK_USERS, currentStore }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
