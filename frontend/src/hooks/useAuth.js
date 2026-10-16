import { useContext } from "react";
import { AuthContext } from "../context";

/**
 * useAuth
 * Custom hook providing access to authentication state and actions.
 * Throws an explicit error if invoked outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
