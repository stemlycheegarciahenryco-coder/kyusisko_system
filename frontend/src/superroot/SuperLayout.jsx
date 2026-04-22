import { Outlet, Navigate } from 'react-router-dom';
import SuperSidebar from './SuperSideBar';

export default function SuperLayout() {
  const role = localStorage.getItem('userRole');

  // Security: If not super_root, kick them back to login
  if (role !== 'super_root') {
    return <Navigate to="/rootlogin" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* The Sidebar is always visible */}
      <SuperSidebar />

      {/* This is where SuperRootConsole, SuperAuditLogs, etc. will load */}
      <main className="flex-1 ml-72">
        <Outlet />
      </main>
    </div>
  );
}