import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { 
  LayoutDashboard, 
  User2Icon, 
  LogOut, 
  University, 
  Settings2Icon 
} from 'lucide-react';
import api from '../api';
import SearchBar from './SearchBar';
import LogoutModal from '../component/LogoutModal';

export default function StudentTopNav() {
  const { refreshProfile } = useStudent();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    window.addEventListener('profilePicUpdated', refreshProfile);
    return () => {
      window.removeEventListener('profilePicUpdated', refreshProfile);
    };
  }, [refreshProfile]);

  const menuItems = [
    { name: 'Home', icon: <LayoutDashboard size={20} />, path: '/scholarships' },
    { name: 'My Scholarships', icon: <University size={20} />, path: '/MyScholarships' },
    { name: 'Profile', icon: <User2Icon size={20} />, path: '/StudentProfile' },
    { name: 'Settings', icon: <Settings2Icon size={20} />, path: '/StudentSettings' },
  ];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#FFFCFB] border-b-2 border-black/5 z-50 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">

          {/* LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Logo" className="h-12 w-14 object-contain" />
          </div>

          {/* GLOBAL SEARCH BAR */}
          <SearchBar />

          {/* NAV LINKS + SIGN OUT, PUSHED TO THE FAR RIGHT */}
          <div className="flex h-full items-center gap-2 lg:gap-4 ml-auto">
            {menuItems.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center px-4 h-full transition-all text-center
                  ${isActive ? 'text-[#093fb4]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon}
                    <span className="text-xs font-black uppercase mt-1 hidden lg:block tracking-tight">
                      {item.name}
                    </span>
                    {isActive && <div className="absolute bottom-0 h-1 w-full bg-[#093fb4]" />}
                  </>
                )}
              </NavLink>
            ))}

            <button
              onClick={() => setShowLogoutModal(true)}
              className="relative flex flex-col items-center justify-center px-4 h-full transition-all text-center text-[#093fb4] hover:bg-red-50 cursor-pointer"
            >
              <LogOut size={20} />
              <span className="text-xs font-black uppercase mt-1 hidden lg:block tracking-tight">
                Sign Out
              </span>
            </button>
          </div>

        </div>
      </nav>

      {/* Reusable Logout Dialog */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        role="student"
      />
    </>
  );
}