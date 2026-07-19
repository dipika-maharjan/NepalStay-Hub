"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  clearAuthCookies,
  getAuthToken,
  getUserData,
  setUserData,
} from "@/lib/cookie";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
interface AuthContextProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: any;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuth: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const readStoredAuth = () => {
    if (typeof window === "undefined") {
      return { token: null as string | null, user: null as any };
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user_data");

    return {
      token,
      user: storedUser ? JSON.parse(storedUser) : null,
    };
  };

  const checkAuth = async () => {
    try {
      const { token: localToken, user: storedUser } = readStoredAuth();
      const token = localToken || (await getAuthToken());
      let userData = storedUser || (await getUserData());

      if (token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }

        try {
          const { data } = await api.get("/api/auth/me");
          if (data.user) {
            userData = data.user;
            if (typeof window !== "undefined") {
              localStorage.setItem("user_data", JSON.stringify(data.user));
            }
            await setUserData(data.user);
          }
        } catch (error) {
          console.error("Failed to fetch fresh user data:", error);
        }
      } else if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
      }

      setUser(userData);
      setIsAuthenticated(!!token);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const refresh = async () => {
    await checkAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await clearAuthCookies();
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
      }
      setIsAuthenticated(false);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        logout,
        loading,
        checkAuth,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
