import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Form, LucideScroll, Pencil, 
  LogOut, User, AlertTriangle, Menu,Logs ,Flag, Settings 
} from 'lucide-react';
import api from '../api';

export default function OrgSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchOrgProfile = async () => {
      try {
        const res = await api.get(`/organizations/profile/me`);
        setOrgData(res.data.data); 
      } catch (err) { 
        console.error("Failed to fetch org profile:", err); 
      }
    };
    fetchOrgProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/OrgDashboard' },
    { name: 'Manage Programs', icon: <LucideScroll size={20} />, path: '/ProgramView' },
    { name: 'Manage Students', icon: <Form size={20} />, path: '/OrgApplicantPrograms' }, 
    { name: 'Profile', icon: <User size={20} />, path: '/OrgProfile' }, 
    { name: 'Reports', icon: <Flag size={20} />, path: '/OrgReports' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/OrgSettings' },
    { name: 'Logs', icon: <Logs size={20} />, path: '/OrgLogs' },
    
  ];

  return ( 
    <div className={`h-screen bg-[#FFFCFB] flex flex-col border-r border-slate-200/80 shadow-2xl relative z-40 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      
      {/* Header / Toggle Button Area */}
      <div className={`p-4 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="p-2 text-slate-500 hover:text-[#093fb4] hover:bg-slate-100 rounded-xl transition-all"
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-4 mb-6 flex flex-col items-center justify-center text-center transition-all">
        <div 
          className={`relative mx-auto cursor-pointer group transition-all duration-300 ${
            isExpanded ? 'w-24 h-24' : 'w-12 h-12'
          }`}
          onClick={() => fileInputRef.current.click()}
        >
          {/* Circular Image Container */}
          <div className="w-full h-full rounded-full border-4 border-[#093fb4]/15 overflow-hidden bg-white shadow-md flex items-center justify-center">
            {orgData?.org_pic ? (
              <img src={orgData.org_pic} className="w-full h-full object-cover" alt="Org Profile" />
            ) : (
              <User className="w-full h-full p-3 text-[#093fb4]" />
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              try {
                const formData = new FormData();
                formData.append('org_pic', file);

                await api.patch(`/organizations/profile-picture/me`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });

                const res = await api.get(`/organizations/profile/me`);
                setOrgData(res.data.data);
              } catch (err) {
                console.error("Upload failed:", err);
              }
            }}
          />

          {/* Edit Badge Icon */}
          <div className="absolute bottom-0 right-0 bg-[#093fb4] text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
            <Pencil size={12} />
          </div>
        </div>

        {/* Increased Text Size & Boldness */}
        {isExpanded && (
          <h3 className="text-slate-900 font-extrabold uppercase text-sm md:text-base tracking-wide truncate mt-3 w-full px-2">
            {orgData?.org_name || "Provider"}
          </h3>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            title={!isExpanded ? item.name : undefined}
            className={({ isActive }) => `
              flex items-center rounded-xl text-xs font-black uppercase tracking-wider transition-all
              ${isExpanded ? 'gap-3.5 px-4 py-3' : 'justify-center py-3 px-0'}
              ${isActive ? 'bg-[#093fb4] text-white shadow-md shadow-[#093fb4]/20' : 'text-slate-600 hover:bg-[#093fb4]/10 hover:text-[#093fb4]'}
            `}
          >
            <span className="shrink-0">{item.icon}</span>
            {isExpanded && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout Action */}
      <div className="p-3 border-t border-slate-200/80">
        <button 
          onClick={() => setShowLogoutDialog(true)}
          title={!isExpanded ? "Sign Out" : undefined}
          className={`
            w-full flex items-center rounded-xl transition-all font-bold text-xs uppercase tracking-wider
            ${isExpanded 
              ? 'gap-3.5 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600'
              : 'justify-center py-3 text-slate-600 hover:bg-red-50 hover:text-red-600'
            }
          `}
        >
          <LogOut size={20} className="shrink-0" />
          {isExpanded && <span>Sign Out</span>}
        </button>
      </div>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-center text-slate-900 mb-2 tracking-tight">Logging Out?</h2>
            <p className="text-slate-500 text-center font-medium mb-8 text-sm px-4 leading-relaxed">
              Are you sure you want to sign out? You will need to log in again to manage scholarships.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogout} 
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 transition-all active:scale-95"
              >
                YES, LOGOUT
              </button>
              <button 
                onClick={() => setShowLogoutDialog(false)} 
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black transition-all active:scale-95"
              >
                STAY LOGGED IN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}