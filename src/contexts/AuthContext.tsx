"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface User {
  id: number;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<User | null>; // Add fetchUser to the context type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getApiUrl = useCallback((endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }, []);

  // This function is kept for potential future use in other parts of the app
  // It's currently not used directly but could be useful for refreshing user data
  const fetchUser = useCallback(async () => {
    try {
      const token = Cookies.get("token");

      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch(getApiUrl("/api/v1/auth/me"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch user data: ${response.status} ${errorText}`
        );
      }

      const userData = await response.json();

      setUser(userData);
      setIsAuthenticated(true);
      return userData; // Return the user data for potential future use
    } catch {
      // If there's an error, clear the token and reset auth state
      Cookies.remove("token");
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getApiUrl]);

  useEffect(() => {
    // Check for stored token and validate it
    const token = Cookies.get("token");
    if (token) {
      // Use our improved fetchUser function
      fetchUser().catch(() => {
        // If token is invalid, it will be removed in fetchUser
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(getApiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      // Set the token in cookies
      Cookies.set("token", data.access_token, {
        expires: 7,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      // Set authenticated state directly
      setIsAuthenticated(true);

      try {
        // Fetch user data and wait for it to complete
        const token = Cookies.get("token");

        const userResponse = await fetch(getApiUrl("/api/v1/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          // Use window.location for more reliable navigation
          window.location.href = "/";
        } else {
          // Still redirect to home page
          window.location.href = "/";
        }
      } catch {
        // Still redirect to home page
        window.location.href = "/";
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(getApiUrl("/api/v1/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      const data = await response.json();
      // Set the token in cookies
      Cookies.set("token", data.access_token, {
        expires: 7,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      // Set authenticated state directly
      setIsAuthenticated(true);

      try {
        // Fetch user data and wait for it to complete
        const token = Cookies.get("token");

        const userResponse = await fetch(getApiUrl("/api/v1/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          // Use window.location for more reliable navigation
          window.location.href = "/";
        } else {
          // Still redirect to home page
          window.location.href = "/";
        }
      } catch {
        // Still redirect to home page
        window.location.href = "/";
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/home");
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    fetchUser, // Add fetchUser to the context value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
