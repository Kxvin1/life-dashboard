"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
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

  useEffect(() => {
    // Check for stored token and validate it
    const token = Cookies.get("token");
    if (token) {
      // Get user data
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to get user data");
          }
          return response.json();
        })
        .then((userData) => {
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch(() => {
          // If token is invalid, remove it
          Cookies.remove("token");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const getApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  };

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

      // Fetch user data and wait for it to complete
      await fetchUser();

      // Only navigate after user data is loaded
      setTimeout(() => {
        router.push("/");
      }, 100); // Small delay to ensure state updates are processed
    } catch (error) {
      console.error("Login error:", error);
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

      // Fetch user data and wait for it to complete
      await fetchUser();

      // Only navigate after user data is loaded
      setTimeout(() => {
        router.push("/");
      }, 100); // Small delay to ensure state updates are processed
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const fetchUser = async () => {
    try {
      const token = Cookies.get("token");
      console.log(
        "Fetching user with token:",
        token ? "Token exists" : "No token"
      );
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }

      console.log("Making request to /api/v1/auth/me");
      const response = await fetch(getApiUrl("/api/v1/auth/me"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to fetch user data: ${response.status} ${errorText}`
        );
      }

      const userData = await response.json();
      console.log("User data received:", userData);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error fetching user:", error);
      // If there's an error, clear the token and reset auth state
      Cookies.remove("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
