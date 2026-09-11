import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { 
  LayoutDashboard, 
  Bell, 
  User2Icon, 
  LogOut, 
  ChevronDown, 
  University, 
  Settings2Icon 
} from 'lucide-react';
import api from '../api';
import SearchBar from './SearchBar';
import LogoutModal from '../component/LogoutModal';
import NotifCard from '../component/NotifCard'; // <-- Newly imported component!

export default function StudentTopNav() {
  const navigate = useNavigate();
  const { student, refreshProfile } = useStudent();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
 
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const handleToggleNotif = async () => {
    const willOpen = !showNotif;
    setShowNotif(willOpen);
    setShowDropdown(false);

    if (willOpen) {
      try {
        const notifRes = await api.get('/notif/notifications');
        setNotifications(notifRes.data.notifications || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }
  };

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notif/notifications/unread-count');
        setUnreadCount(Number(res.data.count) || 0);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };
    fetchUnread();
  }, []);

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

  // ── NOTIFICATION HANDLERS ──

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notif/notifications/mark-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleReadSingle = async (id) => {
    try {
      await api.patch(`/notif/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking single notif as read:", err);
    }
  };

  const handleDeleteSingle = async (id) => {
    try {
      await api.delete(`/notif/notifications/${id}`);
      const deletedNotif = notifications.find(n => n.id === id);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      handleReadSingle(notif.id);
    }
    if (notif.application_id) {
      setShowNotif(false);
      navigate(`/my-scholarships/${notif.application_id}`);
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

          {/* NAV LINKS */}
          <div className="flex h-full items-center gap-2 lg:gap-4">
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
          </div>

          {/* UTILITIES PANEL */}
          <div className="flex items-center gap-3 shrink-0">

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={handleToggleNotif} 
                className="relative p-2 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-800 transition-colors"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-[#FF1E1E] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl p-4 z-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="text-[10px] font-black uppercase tracking-widest text-[#093fb4] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <NotifCard 
                          key={notif.id} 
                          notif={notif} 
                          onRead={handleReadSingle} 
                          onDelete={handleDeleteSingle}
                          onClick={handleNotifClick}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6 font-bold uppercase">No notifications</p>
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
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <div className="h-10 w-10 rounded-xl border-2 border-slate-200 overflow-hidden bg-slate-50">
                  {student?.sprofile_pic ? (
                    <img src={student.sprofile_pic} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="flex items-center justify-center h-full font-black text-[#093fb4] text-sm">
                      {student?.sfirst_name?.[0] || 'S'}
                    </div>
                  )}
                </div>
                <ChevronDown size={18} className={`text-slate-800 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 border border-slate-200">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-xs font-black text-slate-900 uppercase truncate">
                      {student?.sfirst_name} {student?.slast_name}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/StudentSettings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-800 hover:bg-slate-100 text-xs font-black uppercase transition-colors cursor-pointer border-b border-slate-100"
                  >
                    <Settings2Icon size={18} className="text-slate-600" /> Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-[#FF1E1E] hover:bg-red-50 text-xs font-black uppercase transition-colors cursor-pointer"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              )}
            </div>

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