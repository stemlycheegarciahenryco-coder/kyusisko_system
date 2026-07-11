import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StudentTopNav from './StudentTopNav';
import StudentLeftProfile from './StudentLeftProfile'; // 👈 Re-import your left sidebar component
import { StudentProvider } from './StudentContext';

// Pages where the left profile sidebar is redundant (e.g. the page already
// shows full profile details, or the page needs the full width for its own UI)
const HIDE_SIDEBAR_PATHS = ['/StudentProfile', '/MyScholarships', '/StudentMessages'];

export default function StudentLayout() {
  const location = useLocation();
  const hideSidebar = HIDE_SIDEBAR_PATHS.includes(location.pathname);

  return (
    <StudentProvider>
      <div className="min-h-screen bg-[#F0F2F5]">
        {/* Fixed Top Navigation */}
        <StudentTopNav />
        
        {/* Main Content Layout Wrapper */}
        <main className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sticky Left Sidebar Area */}
            {!hideSidebar && (
              <div className="lg:col-span-1 lg:sticky lg:top-20 h-fit">
                <StudentLeftProfile />
              </div>
            )}
            
            {/* Dynamic Page Views Content Area */}
            <div className={hideSidebar ? 'lg:col-span-4' : 'lg:col-span-3'}>
              <Outlet />
            </div>

          </div>
        </main>
      </div>
    </StudentProvider>
  );
}