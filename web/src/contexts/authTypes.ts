import { createContext } from "react";

export type User = {
  id: number;
  email: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
