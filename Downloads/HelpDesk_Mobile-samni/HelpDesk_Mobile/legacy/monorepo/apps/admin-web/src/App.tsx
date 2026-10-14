// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Top-level component: auth context + router
// TODO: Pass localStorage token storage to AuthProvider

import { RouterProvider } from 'react-router';
import { AuthProvider } from '@helpdesk/shared/auth';
import { router } from './router';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
