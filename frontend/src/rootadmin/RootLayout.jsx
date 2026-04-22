import { Outlet } from 'react-router-dom';
import RootSidebar from './RootSidebar';

export default function RootLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Sidebar is fixed on the left */}
      <RootSidebar />

      {/* 2. Content area on the right scrolls independently */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}