import React, { createContext, useContext, useEffect, useState } from "react";
import { StorageService } from "@/services/storage";
import { UserProfile } from "@/types";
import { logUserLogin } from "@/services/userLogger";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    StorageService.get<UserProfile>(StorageService.USER_KEY).then((saved) => {
      if (saved) setUser(saved);
      setIsLoading(false);
    });
  }, []);

  const signIn = async (name: string, email: string) => {
    const profile: UserProfile = {
      id: Date.now().toString(),
      nama: name,
      email: email,
      totalKajian: 0,
      totalCatatan: 0,
      bergabungSejak: new Date().toISOString(),
    };
    await StorageService.set(StorageService.USER_KEY, profile);
    setUser(profile);

    // Fire-and-forget: catat login ke Supabase
    logUserLogin(name, email);
  };

  const signOut = async () => {
    await StorageService.remove(StorageService.USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
