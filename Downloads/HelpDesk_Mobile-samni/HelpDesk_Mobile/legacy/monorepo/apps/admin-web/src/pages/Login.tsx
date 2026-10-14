// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Admin login page
// TODO: Email/password form that calls useAuth().login and only allows ADMIN users

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-80 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">HelpDesk Admin</h1>
        <p className="mt-2 text-sm text-gray-500">Login form goes here.</p>
      </div>
    </div>
  );
}
