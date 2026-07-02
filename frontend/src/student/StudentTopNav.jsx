import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, User2Icon, LogOut, ChevronDown, University, 
  Settings2Icon, AlertCircle, CheckCircle2, XCircle, Info, Mails 
} from 'lucide-react';
import api from '../api';
import SearchBar from './SearchBar'; // Import clean search engine component

export default function StudentTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  // jek: search bar lives in header only on Home; on My Scholarships & Messages it is rendered inside the page content
  const isHome = location.pathname === '/scholarships';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  // Profile & Notifications States
  const [student, setStudent] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const studentId = localStorage.getItem('studentId');

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notif/notifications/unread-count');
        setUnreadCount(Number(res.data.count) || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
  }, []);

  const handleToggleNotif = async () => {
    const willOpen = !showNotif;
    setShowNotif(willOpen);
    setShowDropdown(false);

    if (willOpen) {
      try {
        await api.post('/notif/notifications/mark-read');
        setUnreadCount(0);
        const notifRes = await api.get('/notif/notifications');
        setNotifications(notifRes.data.notifications || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        if (!studentId) return;
        const res = await api.get(`/students/profile-full/${studentId}`);
        setStudent(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNavData();
  }, [studentId]);

  // Click Outside hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        notifRef.current && !notifRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Removed Settings from this row to place it inside the profile burger dropdown
  const menuItems = [
    { name: 'Home', icon: <LayoutDashboard size={18} />, path: '/scholarships' },
    { name: 'My Scholarships', icon: <University size={18} />, path: '/MyScholarships' },
    { name: 'Profile', icon: <User2Icon size={18} />, path: '/StudentProfile' },
    { name: 'Messages', icon: <Mails size={18} />, path: '/StudentMessages' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#FFFCFB] border-b-2 border-black/5 z-50 px-4 sm:px-6 lg:px-8">
        {/* jek: max-width matches content for alignment */}
        <div className="max-w-[90%] mx-auto w-full h-full flex items-center justify-between gap-4">

          {/* LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Logo" className="h-12 w-14 object-contain" />
          </div>

          {/* jek: GLOBAL SEARCH BAR - header only on Home */}
          {isHome && <SearchBar />}

          {/* NAV LINKS */}
          <div className="flex h-full items-center gap-2 lg:gap-4">
            {menuItems.map((item) => (
              <NavLink key={item.name} to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center px-4 h-full transition-all text-center
                  ${isActive ? 'text-[#093fb4]' : 'text-black/40 hover:text-black hover:bg-black/5'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon}
                    <span className="text-[10px] font-black uppercase mt-1 hidden lg:block tracking-tight">
                      {item.name}
                    </span>
                    {isActive && <div className="absolute bottom-0 h-1 w-full bg-[#093fb4]" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* UTILITIES PANEL */}
          <div className="flex items-center gap-3 shrink-0">

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notifRef}>
              <button onClick={handleToggleNotif} className="relative p-2 rounded-xl hover:bg-black/5 cursor-pointer">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl p-4 z-50 border border-black/5">
                  <h3 className="text-xs font-black mb-3 uppercase text-slate-900 tracking-wider">Notifications</h3>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => <NotifCard key={notif.id} notif={notif} />)
                    ) : (
                      <p className="text-[11px] text-black/40 text-center py-6 font-bold uppercase">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setShowNotif(false);
                }}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-black/5 cursor-pointer"
              >
                {/* Cleaned: Removed border-[#093fb4] in favor of modern slate border styling */}
                <div className="h-9 w-9 rounded-xl border border-slate-300 overflow-hidden bg-slate-50">
                  {student?.sprofile_pic ? (
                    <img src={`http://localhost:5000/uploads/${student.sprofile_pic}`} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="flex items-center justify-center h-full font-black text-[#093fb4] text-sm">
                      {student?.sfirst_name?.[0] || 'S'}
                    </div>
                  )}
                </div>
                <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl py-2 z-50 border border-black/5">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-black text-slate-900 uppercase truncate">
                      {student?.sfirst_name} {student?.slast_name}
                    </p>
                  </div>
                  
                  {/* Settings Tab Moved Here inside Burger/Profile Options List */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/StudentSettings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 text-[11px] font-black uppercase transition-colors cursor-pointer border-b border-slate-100/60"
                  >
                    <Settings2Icon size={16} className="text-slate-400" /> Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 text-[11px] font-black uppercase transition-colors cursor-pointer"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFCFB] rounded-[2.5rem] max-w-sm w-full p-10 text-center shadow-2xl border-4 border-white">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Sign Out?</h3>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={handleLogout} className="w-full bg-[#093fb4] text-white font-black py-4 rounded-2xl hover:opacity-95 transition-opacity uppercase text-[11px] tracking-[0.2em] cursor-pointer">
                Confirm
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="w-full bg-slate-100/80 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-200/60 transition-colors uppercase text-[11px] tracking-[0.2em] cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotifCard({ notif }) {
  const title = notif.title?.toLowerCase() || '';
  const config =
    title.includes('approved')
      ? { icon: <CheckCircle2 size={15} />, bg: 'bg-green-50 text-green-600', border: 'border-green-100' }
      : title.includes('rejected') || title.includes('not eligible') || title.includes('taken down')
      ? { icon: <XCircle size={15} />, bg: 'bg-red-50 text-red-600', border: 'border-red-100' }
      : { icon: <Info size={15} />, bg: 'bg-blue-50 text-blue-600', border: 'border-blue-100' };

  return (
    <div className={`p-3 rounded-xl flex gap-3 border border-transparent transition-all hover:bg-slate-50 ${!notif.is_read ? 'bg-slate-50/60 font-semibold' : ''}`}>
      <div className={`w-8 h-8 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}>
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-black text-slate-900 leading-tight">{notif.title}</h4>
        <p className="text-[12px] text-slate-600 mt-1 leading-relaxed break-words whitespace-normal">{notif.message}</p>
      </div>
    </div>
  );
}