import { Outlet } from 'react-router-dom';
import StudentTopNav from './StudentTopNav';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <StudentTopNav />

      {/* Main Content Area - pt-16 matches the nav height */}
      <main className="pt-16 min-h-screen">
        {/* jek: full width, responsive padding for all devices */}
        <div className="max-w-[90%] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}