import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { AppLayout } from '../components/layout/AppLayout';

import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TicketListPage } from '../pages/TicketListPage';
import { TicketCreatePage } from '../pages/TicketCreatePage';
import { TicketDetailPage } from '../pages/TicketDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRouteConfig() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <PrivateRoutes>
            <AppLayout />
          </PrivateRoutes>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/new" element={<TicketCreatePage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
