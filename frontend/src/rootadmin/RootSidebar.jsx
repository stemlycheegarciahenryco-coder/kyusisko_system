import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconBuildingCommunity, 
  IconUsers, 
  IconFileDescription, 
  IconHistory, 
  IconLogout,
  IconChevronRight,
  IconMenu2,
  IconX,
  IconAlertTriangle
} from '@tabler/icons-react';

export default function RootSidebar() {
  const [isOpen, setIsOpen] = useState(false); // Mobile Drawer Toggle
  const [isExpanded, setIsExpanded] = useState(true); // Desktop Mini/Full Toggle
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Full Center Modal Toggle
  const [adminName, setAdminName] = useState({ firstName: 'System', lastName: 'Admin' });

  // Dynamically load the authenticated user's name from localStorage on mount
  useEffect(() => {
    const storedFirstName = localStorage.getItem('firstName');
    const storedLastName = localStorage.getItem('lastName');
    if (storedFirstName || storedLastName) {
      setAdminName({
        firstName: storedFirstName || '',
        lastName: storedLastName || ''
      });
    }
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <IconLayoutDashboard size={20} />, path: '/RootDashboard' },
    { name: 'Organization', icon: <IconBuildingCommunity size={20} />, path: '/RootOrganization' },
    { name: 'Student Log', icon: <IconUsers size={20} />, path: '/RootStudLog' },
    { name: 'Reports', icon: <IconFileDescription size={20} />, path: '/RootReports' },
    { name: 'Audit Log', icon: <IconHistory size={20} />, path: '/RootAudit' }
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      {/* 1. MOBILE ONLY ACTION BAR TRIGGER */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-[#FFFCFB] text-slate-800 rounded-xl shadow-xl border border-black/5 flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          {isOpen ? <IconX size={18} stroke={2.5} className="text-[#093fb4]" /> : <IconMenu2 size={18} stroke={2.5} />}
        </button>
      </div>

      {/* MOBILE DRAWER BLACKOUT LAYER */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 2. THE MAIN SIDEBAR COMPONENT FRAME */}
      <div className={`
        fixed md:sticky top-0 left-0 h-screen bg-[#FFFCFB] flex flex-col rounded-r-[2rem] border-r border-slate-50 shadow-2xl shadow-[#093fb4]/15 font-['Inter'] z-20 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isExpanded ? 'md:w-64' : 'md:w-22'}
      `}>
        
        {/* HEADER BAR: Desktop Collapse Switch Button & Brand Logo */}
        <div className="pt-6 px-4 flex flex-col items-center gap-2 shrink-0 relative">
          {/* Desktop Toggle Menu Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="hidden md:flex self-end p-2 text-slate-400 hover:text-[#093fb4] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <IconMenu2 size={18} stroke={2.5} />
          </button>

          {/* Scalable App Identity Frame */}
          <div className={`transition-all duration-300 flex items-center justify-center ${isExpanded ? 'h-20 w-auto' : 'h-12 w-12 mt-1'}`}>
            <img 
              src="/logo.png" 
              alt="KyusISKO Logo" 
              className={`object-contain transition-all duration-300 ${isExpanded ? 'h-16' : 'h-10'}`} 
            />
          </div>
        </div>

        {/* 👤 AUTHENTICATED ADMINISTRATOR IDENTIFICATION PROFILE BADGE */}
        <div className="px-4 mt-4 shrink-0">
          <div className={`
            flex items-center bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-300 p-3
            ${isExpanded ? 'justify-start gap-3 w-full' : 'justify-center w-14 mx-auto'}
          `}>
            {/* User Profile Avatar Icon Shield */}
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#093fb4] flex items-center justify-center shrink-0 border border-blue-100">
              <IconUsers size={18} stroke={2} />
            </div>
            
            {/* Conditional Title Identity Metadata Stack */}
            <div className={`transition-all duration-200 min-w-0 flex flex-col
              ${isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 hidden pointer-events-none'}
            `}>
              <p className="text-[12px] font-black text-slate-800 tracking-tight uppercase truncate">
                {adminName.firstName} {adminName.lastName}
              </p>
              <p className="text-[9px] font-bold text-[#093fb4] tracking-wider uppercase opacity-80 mt-0.5">
                System Admin
              </p>
            </div>
          </div>
        </div>

        {/* COMPACT NAVIGATION INTERFACES LIST */}
        <nav className="flex-1 px-3 space-y-1.5 mt-6 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3.5 rounded-xl transition-all group relative
                ${isExpanded ? 'justify-between gap-3' : 'justify-center'}
                ${isActive 
                  ? 'bg-[#093fb4] text-white shadow-lg shadow-blue-900/10' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#093fb4]'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="shrink-0 transition-transform group-hover:scale-105">
                      {item.icon}
                    </span>
                    
                    <span className={`text-[13px] font-medium tracking-wide transition-all duration-200 truncate
                      ${isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'}
                    `}>
                      {item.name}
                    </span>
                  </div>
                  
                  {isActive && isExpanded && (
                    <IconChevronRight size={16} className="opacity-60 shrink-0" stroke={2} />
                  )}

                  {/* MINI HOVER TOOLTIP */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium tracking-wide rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* SIGN OUT FOOTER ANCHOR BLOCK */}
        <div className="p-3 mt-auto border-t border-slate-100/80 bg-[#FFFCFB] rounded-br-[2rem] shrink-0">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center text-slate-700 hover:bg-red-50 hover:text-[#FF1E1E] rounded-xl transition-all group cursor-pointer p-3.5 relative
              ${isExpanded ? 'gap-3' : 'justify-center'}
            `}
          >
            <IconLogout size={20} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
            
            <span className={`text-[13px] font-medium tracking-wide transition-all duration-200 truncate
              ${isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'}
            `}>
              Sign out
            </span>

            {/* MINI LOGOUT HOVER TOOLTIP */}
            {!isExpanded && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-red-600 text-white text-[11px] font-medium tracking-wide rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 3. CENTERED APPLICATION LOGOUT MODAL OVERLAY */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowLogoutModal(false)}
          />
          
          <div className="bg-white border border-black/5 rounded-2xl p-8 w-full max-w-md shadow-2xl transform scale-100 transition-all relative z-10 text-center font-['Inter']">
            <div className="w-14 h-14 bg-red-50 text-[#FF1E1E] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <IconAlertTriangle size={26} stroke={1.5} />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
              Confirm Account Logout
            </h3>
            <p className="text-[13px] text-slate-500 font-normal mt-2 leading-relaxed max-w-xs mx-auto">
              Are you sure you want to exit KyusISKO? You will need to re-authenticate to view system audit logs and controls.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleLogout}
                className="bg-[#FF1E1E] text-white py-3 px-4 rounded-xl text-[12px] font-medium tracking-wide hover:bg-red-700 active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                Yes, Sign out
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-slate-50 border border-slate-200/60 text-slate-600 py-3 px-4 rounded-xl text-[12px] font-medium tracking-wide hover:bg-slate-100 active:scale-98 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}