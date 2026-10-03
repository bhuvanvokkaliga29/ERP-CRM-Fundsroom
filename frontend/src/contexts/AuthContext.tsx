import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  demoLogin: (role?: User['role']) => void;
  logout: () => void;
}

/** Check if the current session is a frontend-only demo */
export function isDemoMode(): boolean {
  return localStorage.getItem('demoMode') === 'true';
}

const DEMO_USERS: Record<User['role'], User> = {
  ADMIN: { id: 'demo-admin', name: 'Demo Admin', email: 'admin@ledger.test', role: 'ADMIN' },
  SALES: { id: 'demo-sales', name: 'Demo Sales', email: 'sales@ledger.test', role: 'SALES' },
  WAREHOUSE: { id: 'demo-warehouse', name: 'Demo Warehouse', email: 'warehouse@ledger.test', role: 'WAREHOUSE' },
  ACCOUNTS: { id: 'demo-accounts', name: 'Demo Accounts', email: 'accounts@ledger.test', role: 'ACCOUNTS' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // If we were in demo mode, restore the demo user from localStorage
      if (isDemoMode()) {
        const savedRole = (localStorage.getItem('demoRole') || 'ADMIN') as User['role'];
        setUser(DEMO_USERS[savedRole] || DEMO_USERS.ADMIN);
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error('Auth initialization failed', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demoRole');
    setUser(userData);
  };

  /** Frontend-only demo login — no backend required */
  const demoLogin = (role: User['role'] = 'ADMIN') => {
    const demoUser = DEMO_USERS[role];
    // Set a fake token so axios interceptors don't complain
    localStorage.setItem('token', 'demo-token-' + role.toLowerCase());
    localStorage.setItem('tenantId', 'demo');
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', role);
    setUser(demoUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demoRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
