import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "../context";
import { authApi } from "../api/auth";

/**
 * AuthProvider
 * Manages authentication lifecycle, token persistence, and session verification.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("helpdesk_access_token"),
  );
  const [loading, setLoading] = useState(true);

  const handleAuthExpired = useCallback(() => {
    localStorage.removeItem("helpdesk_access_token");
    localStorage.removeItem("helpdesk_refresh_token");
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    window.addEventListener("helpdesk:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("helpdesk:auth-expired", handleAuthExpired);
    };
  }, [handleAuthExpired]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem("helpdesk_access_token");
      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await authApi.getMe();
        if (isMounted) {
          setUser(userData);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn("Session verification failed:", err.message);
        if (isMounted) {
          handleAuthExpired();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [handleAuthExpired]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    const { access, refresh, user: userData } = data;

    if (access) {
      localStorage.setItem("helpdesk_access_token", access);
      if (refresh) {
        localStorage.setItem("helpdesk_refresh_token", refresh);
      }
      setToken(access);
      setUser(userData);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("helpdesk_refresh_token");
    try {
      await authApi.logout(refreshToken);
    } catch (err) {
      console.warn(
        "Logout API call failed, clearing local state anyway:",
        err.message,
      );
    } finally {
      handleAuthExpired();
    }
  }, [handleAuthExpired]);

  const register = useCallback(async (username, email, password) => {
    const data = await authApi.register(username, email, password);
    const { access, refresh, user: userData } = data;

    if (access) {
      localStorage.setItem("helpdesk_access_token", access);
      if (refresh) {
        localStorage.setItem("helpdesk_refresh_token", refresh);
      }
      setToken(access);
      setUser(userData);
    }
    return data;
  }, []);

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isUser,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
