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
  is_demo_user?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<User | null>;
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
  const [isDemoUser, setIsDemoUser] = useState(false);
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

      // Set demo user state if applicable
      if (userData.is_demo_user) {
        setIsDemoUser(true);
      } else {
        setIsDemoUser(false);
      }

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
      setIsDemoUser(false);

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
        const errorText = await response.text();

        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);

          // Create user-friendly error messages
          let userFriendlyMessage =
            "Please check your information and try again.";

          // Handle common error cases with user-friendly messages
          if (errorData.detail) {
            // If detail is an array of validation errors (FastAPI format)
            if (Array.isArray(errorData.detail)) {
              const messages = [];

              for (const error of errorData.detail) {
                // Extract field name from the location path
                const fieldName =
                  error.loc && error.loc.length > 1 ? error.loc[1] : "";

                // Create user-friendly messages based on field and error type
                if (fieldName === "email") {
                  messages.push("Please enter a valid email address");
                } else if (fieldName === "password") {
                  messages.push("Your password doesn't meet the requirements");
                } else if (fieldName === "full_name") {
                  messages.push("Please check your name");
                }
                // If we can't determine the field, use a generic message
                else {
                  messages.push("Please check your information");
                }
              }

              if (messages.length > 0) {
                userFriendlyMessage = messages.join(". ");
              }
            }
            // If detail is a string
            else if (typeof errorData.detail === "string") {
              if (errorData.detail.includes("already registered")) {
                userFriendlyMessage =
                  "This email is already registered. Please use a different email or try logging in.";
              } else {
                userFriendlyMessage = "Registration failed. Please try again.";
              }
            }
          }

          // Handle specific field errors
          else if (typeof errorData === "object") {
            const messages = [];

            if (errorData.email) {
              messages.push("Please enter a valid email address");
            }
            if (errorData.password) {
              messages.push("Your password doesn't meet the requirements");
            }
            if (errorData.full_name) {
              messages.push("Please check your name");
            }

            if (messages.length > 0) {
              userFriendlyMessage = messages.join(". ");
            }
          }

          throw new Error(userFriendlyMessage);
        } catch (parseError) {
          // If we couldn't parse JSON or another error occurred during parsing
          throw new Error(
            "Registration failed. Please check your information and try again."
          );
        }
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
      setIsDemoUser(false);

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

  const loginAsDemo = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(getApiUrl("/api/v1/auth/demo"), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to login as demo user");
      }

      const data = await response.json();

      // Set the token in cookies
      Cookies.set("token", data.access_token, {
        expires: 1, // Demo user token expires in 1 day
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      // Set authenticated state
      setIsAuthenticated(true);
      setIsDemoUser(true);

      try {
        // Fetch user data
        const token = Cookies.get("token");

        const userResponse = await fetch(getApiUrl("/api/v1/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser({
            ...userData,
            is_demo_user: true, // Ensure this flag is set on the frontend
          });

          // Redirect to dashboard
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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    setIsAuthenticated(false);
    setIsDemoUser(false);
    router.push("/home");
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isDemoUser,
    login,
    register,
    loginAsDemo,
    logout,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
