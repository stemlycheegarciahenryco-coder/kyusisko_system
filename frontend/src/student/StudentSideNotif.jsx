import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import api from '../api';

const StudentSideNotif = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notif/notifications');
        const data = res.data.notifications || [];
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notif/notifications/unread-count');
        setUnreadCount(Number(res.data.count) || 0);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchNotifications();
    fetchUnreadCount();
  }, []);

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
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking single notif as read:", err);
    }
  };

  const handleDeleteSingle = async (e, id) => {
    e.stopPropagation();
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
      navigate(`/my-scholarships/${notif.application_id}`);
    }
  };

  const visibleNotifs = showAll ? notifications : notifications.slice(0, 5);

  const NotifItem = ({ notif }) => (
    <div
      onClick={() => handleNotifClick(notif)}
      className="group flex items-start gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer border border-transparent hover:bg-slate-50 hover:border-black/5 transition-all"
    >
      <div
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border border-black/5 ${
          notif.is_read ? 'bg-slate-100' : 'bg-blue-50'
        }`}
      >
        <Bell size={16} className={notif.is_read ? 'text-black/30' : 'text-[#093fb4]'} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate leading-tight ${
            notif.is_read ? 'font-semibold text-black/70' : 'font-bold text-black'
          }`}
        >
          {notif.title || notif.message}
        </p>
        {notif.title && notif.message && (
          <p className="text-[13px] text-black/50 truncate">{notif.message}</p>
        )}
      </div>

      {!notif.is_read && (
        <span className="shrink-0 w-2 h-2 rounded-full bg-[#093fb4] mt-1.5" />
      )}

      <button
        onClick={(e) => handleDeleteSingle(e, notif.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-black/30 hover:text-red-500 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-black/8 shadow-sm p-5 w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-black text-black/60 uppercase tracking-widest">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF1E1E] text-white text-[11px] font-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-black uppercase tracking-widest text-[#093fb4] hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8 font-bold uppercase tracking-widest">
          No notifications
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {visibleNotifs.map((n) => (
            <NotifItem key={n.id} notif={n} />
          ))}
        </div>
      )}

      {notifications.length > 5 && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-3 w-full text-[13px] font-semibold text-black/40 hover:text-black/60 py-1.5 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
        >
          {showAll ? '↑ Show less' : `See all ${notifications.length} notifications`}
        </button>
      )}
    </div>
  );
};

export default StudentSideNotif;