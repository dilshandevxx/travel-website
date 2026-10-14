// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Admin routes
// TODO: Protect AdminLayout routes: redirect to /login when not an ADMIN

import { createBrowserRouter } from 'react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VerificationQueue } from './pages/VerificationQueue';
import { Bookings } from './pages/Bookings';
import { BookingDetail } from './pages/BookingDetail';
import { Complaints } from './pages/Complaints';
import { Users } from './pages/Users';
import { PricingRules } from './pages/PricingRules';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'verification', element: <VerificationQueue /> },
      { path: 'bookings', element: <Bookings /> },
      { path: 'bookings/:id', element: <BookingDetail /> },
      { path: 'complaints', element: <Complaints /> },
      { path: 'users', element: <Users /> },
      { path: 'pricing-rules', element: <PricingRules /> },
    ],
  },
]);
