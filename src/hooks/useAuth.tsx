import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, getJson, getToken, postJson, setToken } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<User>;
  signUp: (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await getJson<{ user: User }>('/api/auth/me');
        if (!cancelled) setUser(me);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setToken(null);
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await postJson<AuthResponse>('/api/auth/login', {
      username,
      password,
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signUp = useCallback(
    async (username: string, email: string, password: string, displayName?: string) => {
      const res = await postJson<AuthResponse>('/api/auth/register', {
        username,
        email,
        password,
        ...(displayName ? { displayName } : {}),
      });
      setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      if (getToken()) {
        await postJson('/api/auth/logout');
      }
    } catch {
      // Best-effort — always clear local session below.
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
