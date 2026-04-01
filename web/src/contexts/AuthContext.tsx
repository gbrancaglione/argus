import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiRequest } from "../api/client";

type User = {
  id: number;
  email: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = "argus_user";

function loadStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ user: User }>("/session", {
      method: "POST",
      body: { email, password },
    });

    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("/session", { method: "DELETE" });
    } finally {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
