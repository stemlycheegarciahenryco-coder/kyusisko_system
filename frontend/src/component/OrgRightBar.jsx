import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Bell, ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react';
import api from '../api'; 

// ─── Helper Function: Time Ago ───────────────────────────────────────────────
function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
}

// ─── Top Right Mini Calendar Widget ──────────────────────────────────────────
function MiniCalendar({ programs = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const deadlineDays = programs.map(p => {
    const d = new Date(p.deadline);
    return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
  }).filter(Boolean);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-slate-900">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 uppercase mb-3">
        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-bold text-sm">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isDeadline = deadlineDays.includes(day);
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

          return (
            <div
              key={day}
              className={`p-2 rounded-full flex flex-col items-center justify-center relative cursor-pointer text-xs md:text-sm ${
                isToday 
                  ? 'bg-blue-600 text-white font-black shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {day}
              {isDeadline && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-amber-300' : 'bg-blue-600'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar Component ─────────────────────────────────────────────────────────
export default function OrgRightBar({ programs = [] }) {
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    const fetchRightBarData = async () => {
      try {
        const conflictsRes = await api.get('/organizations/conflicts');
        setConflicts(conflictsRes.data?.data || []);
        
        // Fetch Notifications instead of Activity Logs
        const notifRes = await api.get('/notif/org');
        setNotifications(notifRes.data?.data || []);
      } catch (err) {
        console.error("Error fetching right bar data:", err);
      } finally {
        setLoadingConflicts(false);
        setLoadingNotifs(false);
      }
    };
    
    fetchRightBarData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notif/org/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking org notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 flex flex-col h-full">

      {/* 1. Mini Calendar (Top Right) */}
      <MiniCalendar programs={programs} />

      {/* 2. Monitored Applications Section */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
        <div className="w-full flex items-center gap-2.5 text-sm font-extrabold text-slate-900 mb-4">
          <Shield size={18} className="text-purple-600 shrink-0" />
          <span>Student Monitored Applications</span>
        </div>

        {loadingConflicts ? (
          <div className="py-6 text-xs font-bold text-slate-400 animate-pulse">Checking status...</div>
        ) : conflicts.length > 0 ? (
          <div className="w-full space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {conflicts.map(c => (
              <div 
                key={c.student_id} 
                className="p-3 bg-red-50/70 rounded-xl border border-red-200/80 text-left transition-colors"
              >
                <p className="font-extrabold text-sm text-red-950">{c.sfirst_name} {c.slast_name}</p>
                <p className="text-xs text-red-700 font-medium mt-0.5">
                  {c.conflict_display} 
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-100">
              <CheckCircle size={26} className="text-emerald-500" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">No Scholarship Conflicts</h4>
            <p className="text-xs font-medium text-slate-500 mt-1">All monitored applications are in good standing.</p>
          </div>
        )}
      </section>

      {/* 3. Notifications Section */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-[#FF1E1E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors tracking-wider"
            >
              <CheckCheck size={14} /> Mark Read
            </button>
          )}
        </div>

        <div className="space-y-3 flex-1 max-h-[360px] overflow-y-auto pr-1">
          {loadingNotifs ? (
            <div className="text-center text-xs font-bold text-slate-400 animate-pulse py-4">Loading notifications...</div>
          ) : notifications.length === 0 ? (
             <div className="text-center text-xs font-medium text-slate-400 py-4 flex flex-col items-center gap-2">
               <Bell size={24} className="text-slate-300" />
               No new notifications
             </div>
          ) : (
            notifications.slice(0, 15).map((notif) => (
              <NotifItem 
                key={notif.id}
                title={notif.title} 
                message={notif.message} 
                time={timeAgo(notif.created_at)} 
                isRead={notif.is_read} 
              />
            ))
          )}
        </div>
      </section>

    </div>
  );
}

// ─── Dynamic Notification Item Component ───────────────────────────────────────
function NotifItem({ title, message, time, isRead }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all border ${!isRead ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${!isRead ? 'bg-blue-100 text-[#093fb4]' : 'bg-slate-100 text-slate-400'}`}>
        <Bell size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-tight tracking-tight ${!isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
          {title}
        </p>
        <p className={`text-[11px] leading-relaxed mt-1 ${!isRead ? 'text-slate-800 font-semibold' : 'text-slate-500 font-medium'}`}>
          {message}
        </p>
        <span className="text-[10px] font-bold text-slate-400 mt-1.5 block uppercase tracking-widest">{time}</span>
      </div>
    </div>
  );
}