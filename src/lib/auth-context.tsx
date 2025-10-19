"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, User } from "./auth-service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone_number: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  const isAuthenticated = hasToken;

  const login = async (
    phone_number: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await authService.login({
        phone_number,
        password,
      });

      if (response.success && response.user) {
        setUser(response.user);
        setHasToken(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setHasToken(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      // Silently handle invalid token errors during initialization
      console.log("Token validation failed, clearing authentication");
      setUser(null);
      setHasToken(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      setHasToken(!!token);

      if (token) {
        // If we have a token, try to load the user immediately
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
            console.log("User loaded successfully on init");
          } else {
            // Token is invalid, clear it
            console.log("Invalid token on init, clearing authentication");
            setUser(null);
            setHasToken(false);
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
          }
        } catch {
          // Token is invalid, clear it
          console.log(
            "Token validation failed on init, clearing authentication"
          );
          setUser(null);
          setHasToken(false);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loadUser = async (): Promise<void> => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setUser(null);
      setHasToken(false);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        setHasToken(true);
      } else {
        // Token is invalid, clear it
        console.log("Invalid token in loadUser, clearing authentication");
        setUser(null);
        setHasToken(false);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
      }
    } catch {
      // Token is invalid, clear it
      console.log(
        "Token validation failed in loadUser, clearing authentication"
      );
      setUser(null);
      setHasToken(false);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  };

  const setUserDirect = (user: User | null) => {
    setUser(user);
    setHasToken(!!user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        setUser: setUserDirect,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
