// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Browser entry point for the admin dashboard
// TODO: Nothing more needed unless global providers are added

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
