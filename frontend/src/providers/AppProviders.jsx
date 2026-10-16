import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";

/**
 * AppProviders
 * Centralized composition root for all global context providers.
 */
export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}
