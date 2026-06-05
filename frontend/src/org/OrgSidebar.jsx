import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Form, LucideScroll, Pencil, 
  LogOut, User, AlertTriangle, ChevronRight, Menu,Archive, Mails 
} from 'lucide-react';
import api from '../api';

export default function OrgSidebar() {
  const [isExpanded, setIsExpanded] = useState(true); // Toggle State
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const fileInputRef = useRef(null);
  
  const orgId = localStorage.getItem('orgId');

  useEffect(() => {
    const fetchOrgProfile = async () => {
      try {
        if (!orgId) return;
        const res = await api.get(`/organizations/profile/${orgId}`);
        setOrgData(res.data.data); 
      } catch (err) { console.error(err); }
    };
    fetchOrgProfile();
  }, [orgId]);


  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/OrgDashboard' },
    { name: 'Manage Programs', icon: <LucideScroll size={20} />, path: '/ProgramView' },
    { name: 'Applicants', icon: <Form size={20} />, path: '/OrgApplicantPrograms' }, 
    { name: ' Messages', icon: <Mails size={20} />, path: '/OrgMessages' },
    { name: 'Profile', icon: <User size={20} />, path: '/OrgProfile' }, 
    { name: ' Program Archive', icon: <Archive size={20} />, path: '/OrgHistory' },

  ];

  return ( 
    <div className={`h-screen bg-[#FFFCFB] flex flex-col border-r-2 border-black/10 shadow-2xl relative z-40 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      
      {/* Toggle Button */}
      <button onClick={() => setIsExpanded(!isExpanded)} className="p-4 text-black/50 hover:text-[#093fb4]">
        <Menu size={24} />
      </button>

      {/* Profile Section - Shrinks when collapsed */}
      <div className={`px-4 mb-8 text-center transition-all`}>
  
  <div 
    className={`relative mx-auto cursor-pointer group transition-all 
    ${isExpanded ? 'w-20 h-20' : 'w-14 h-14'}`}
    onClick={() => fileInputRef.current.click()}
  >
    
    {/* IMAGE */}
    <div className="w-full h-full rounded-2xl border-4 border-[#093fb4]/10 overflow-hidden bg-white shadow-md">
      {orgData?.org_pic ? (
        <img 
          src={`http://localhost:5000/${orgData.org_pic}`} 
          className="w-full h-full object-cover"
        />
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

      await api.patch(`/organizations/profile-picture/${orgId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 🔄 refresh image
      const res = await api.get(`/organizations/profile/${orgId}`);
      setOrgData(res.data.data);

    } catch (err) {
      console.error("Upload failed:", err);
    }
  }}
/>

    {/* ✏️ EDIT ICON (RESTORED) */}
    <div className="absolute -bottom-1 -right-1 bg-[#093fb4] text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
      <Pencil size={12} />
    </div>

  </div>

  {/* NAME */}
  {isExpanded && (
    <h3 className="text-black font-black uppercase text-xs truncate mt-2">
      {orgData?.org_name || "Provider"}
    </h3>
  )}
</div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink key={item.name} to={item.path} className={({ isActive }) => `
            flex items-center gap-4 px-4 py-3 rounded-xl text-[12px] font-black uppercase transition-all
            ${isActive ? 'bg-[#093fb4] text-white' : 'text-black/60 hover:bg-[#093fb4]/5'}
          `}>
            {item.icon}
            {isExpanded && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-black/10">
  <button 
    onClick={() => setShowLogoutDialog(true)}
    className={`
      w-full flex items-center justify-center rounded-xl transition-all
      ${isExpanded 
        ? 'gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-500'
        : 'py-3 text-slate-500 hover:text-red-500'
      }
    `}
  >
    <LogOut size={20} />
    
    {/* TEXT ONLY WHEN EXPANDED */}
    {isExpanded && <span>Sign Out</span>}
  </button>
</div>

      {/* 🚪 LOGOUT CONFIRMATION DIALOG */}
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