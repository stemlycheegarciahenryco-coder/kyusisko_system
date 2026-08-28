import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Bell, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
      {/* Calendar Header */}
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

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 uppercase mb-3">
        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
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
  const navigate = useNavigate();
  
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(true);

  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchRightBarData = async () => {
      try {
        // Fetch Conflicts
        const conflictsRes = await api.get('/organizations/conflicts');
        setConflicts(conflictsRes.data?.data || []);
        
        // Fetch Dynamic Activity Logs
        const logsRes = await api.get('/organizations/activity-logs');
        setActivityLogs(logsRes.data?.data || []);
      } catch (err) {
        console.error("Error fetching right bar data:", err);
      } finally {
        setLoadingConflicts(false);
        setLoadingLogs(false);
      }
    };
    
    fetchRightBarData();
  }, []);

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
                key={c.id} 
                onClick={() => navigate(`/scholarship/${c.scholarship_id}/applicants`)}
                className="p-3 bg-red-50/70 rounded-xl border border-red-200/80 text-left cursor-pointer hover:bg-red-50 transition-colors"
              >
                <p className="font-extrabold text-sm text-red-950">{c.sfirst_name} {c.slast_name}</p>
                <p className="text-xs text-red-700 font-medium mt-0.5">
                  Conflict: <span className="font-bold">{c.conflicting_org || 'Unknown Organization'}</span>
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

      {/* 3. Activity Log Section */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">Activity Log</h3>
          <div className="flex items-center gap-2">
            {activityLogs.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {activityLogs.length > 99 ? '99+' : activityLogs.length}
              </span>
            )}
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
        </div>

        <div className="space-y-4 flex-1 max-h-[360px] overflow-y-auto pr-1">
          {loadingLogs ? (
            <div className="text-center text-xs font-bold text-slate-400 animate-pulse py-4">Loading logs...</div>
          ) : activityLogs.length === 0 ? (
             <div className="text-center text-xs font-medium text-slate-400 py-4">No recent activities</div>
          ) : (
            // Slicing to 15 items so the bar doesn't get overwhelmingly long, view all can handle the rest
            activityLogs.slice(0, 15).map((log) => (
              <ActivityItem 
                key={log.id}
                user={log.user} 
                detail={log.detail} 
                time={timeAgo(log.createdAt)} 
              />
            ))
          )}
        </div>

        <p className="text-xs font-bold text-slate-400 text-center mt-4">Showing latest activities</p>
      </section>

    </div>
  );
}

// ─── Dynamic Activity Item Component ───────────────────────────────────────────
function ActivityItem({ user, detail, time }) {
  return (
    <div className="flex items-start gap-3 text-xs md:text-sm">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
        <User size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-700 leading-snug">
          <span className="font-extrabold text-slate-900">{user}</span> {detail}
        </p>
        <span className="text-xs font-semibold text-slate-400 mt-1 block">{time}</span>
      </div>
    </div>
  );
}