// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Sidebar + content layout for all logged-in admin pages
// TODO: Add logged-in admin name and logout button

import { NavLink, Outlet } from 'react-router';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/verification', label: 'Verification queue' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/complaints', label: 'Complaints' },
  { to: '/users', label: 'Users' },
  { to: '/pricing-rules', label: 'Pricing rules' },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <h1 className="mb-6 text-lg font-semibold">HelpDesk Admin</h1>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
