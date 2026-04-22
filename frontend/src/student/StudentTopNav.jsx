import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bell, User2Icon, LogOut, Settings2Icon, AlertCircle } from 'lucide-react';

export default function StudentTopNav() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { name: 'Home', icon: <LayoutDashboard size={20} />, path: '/scholarships' },
    { name: 'Notifications', icon: <Bell size={20} />, path: '/StudentNotification' },
    { name: 'Profile', icon: <User2Icon size={20} />, path: '/student-profile' },
    { name: 'Settings', icon: <Settings2Icon size={20} />, path: '/StudentSettings' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-6">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          
          {/* Branding */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <h1 className="text-xl font-black italic tracking-tighter leading-none">K</h1>
            </div>
            <span className="hidden md:block font-black text-slate-900 tracking-tighter uppercase text-sm">KyusISKO</span>
          </div>

          {/* Center Navigation */}
          <div className="flex h-full items-center gap-1 md:gap-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  relative flex flex-col items-center justify-center px-6 h-full transition-all group
                  ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                `}
              >
                {/* We use a function here to get access to isActive for the child elements */}
                {({ isActive }) => (
                  <>
                    {item.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 hidden md:block">
                      {item.name}
                    </span>
                    
                    {/* Active Underline Indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full animate-in slide-in-from-bottom-1 duration-300" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut size={18} />
              <span className="hidden sm:block">Exit</span>
            </button>
          </div>
        </div>
      </nav>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">End Session?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
              Are you sure you want to log out of your <span className="text-blue-600 font-bold">KyusISKO</span> account?
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500 text-white font-black py-4 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all uppercase text-xs tracking-widest"
              >
                Yes, Log Out
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}