import { Outlet } from 'react-router-dom';
import StudentTopNav from './StudentTopNav';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <StudentTopNav />

      {/* Main Content Area - pt-16 matches the nav height */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}