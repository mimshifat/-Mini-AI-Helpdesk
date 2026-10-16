import React from "react";
import { AppProviders } from "./providers/AppProviders";
import { AppRouteConfig } from "./routes/Route";

/**
 * Root Application Component.
 * Composes global context providers and central route definitions.
 */
export default function App() {
  return (
    <AppProviders>
      <AppRouteConfig />
    </AppProviders>
  );
}
