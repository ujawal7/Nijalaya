import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (userId: number, pin?: string) => Promise<void>;
  logout: () => void;
  showProfileSelector: () => void;
  createUser: (userData: { username: string; name: string; pin?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("nijalaya-current-user");
    return stored ? JSON.parse(stored) : null;
  });
  
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: true,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ userId, pin }: { userId: number; pin?: string }) => {
      const response = await apiRequest("POST", `/api/users/${userId}/login`, { pin });
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      localStorage.setItem("nijalaya-current-user", JSON.stringify(userData));
      setLocation("/dashboard");
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; name: string; pin?: string }) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const login = async (userId: number, pin?: string) => {
    await loginMutation.mutateAsync({ userId, pin });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("nijalaya-current-user");
    setLocation("/");
  };

  const showProfileSelector = () => {
    setLocation("/");
  };

  const createUser = async (userData: { username: string; name: string; pin?: string }) => {
    await createUserMutation.mutateAsync(userData);
  };

  // Redirect to login if no user and not already on login page
  useEffect(() => {
    if (!user && location !== "/") {
      setLocation("/");
    }
  }, [user, location, setLocation]);

  return (
    <AuthContext.Provider value={{
      user,
      users,
      login,
      logout,
      showProfileSelector,
      createUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
