import { useState, useCallback, type ReactNode } from "react";
import { apiRequest } from "../api/client";
import { AuthContext, type User } from "./authTypes";

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
