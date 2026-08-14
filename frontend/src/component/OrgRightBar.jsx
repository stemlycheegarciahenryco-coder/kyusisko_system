import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Bell, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

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
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-slate-900">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 uppercase mb-2">
        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1.5" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isDeadline = deadlineDays.includes(day);
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

          return (
            <div
              key={day}
              className={`p-1.5 rounded-full flex flex-col items-center justify-center relative cursor-pointer text-xs ${
                isToday 
                  ? 'bg-blue-600 text-white font-black shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {day}
              {isDeadline && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-amber-300' : 'bg-blue-600'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar Component ─────────────────────────────────────────────────────────
export default function OrgRightBar({ recentApplications = [], programs = [] }) {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(true);

  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const response = await api.get('/organizations/conflicts');
        setConflicts(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching conflicts:", err);
      } finally {
        setLoadingConflicts(false);
      }
    };
    fetchConflicts();
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-full">

      {/* 1. Mini Calendar (Top Right) */}
      <MiniCalendar programs={programs} />

      {/* 2. Monitored Applications Section */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center text-center">
        <div className="w-full flex items-center gap-2 text-xs font-extrabold text-slate-900 mb-4">
          <Shield size={16} className="text-purple-600" />
          <span>Student Monitored Applications</span>
        </div>

        {loadingConflicts ? (
          <div className="py-6 text-xs font-bold text-slate-400 animate-pulse">Checking status...</div>
        ) : conflicts.length > 0 ? (
          <div className="w-full space-y-2 max-h-[180px] overflow-y-auto">
            {conflicts.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/scholarship/${c.scholarship_id}/applicants`)}
                className="p-2.5 bg-red-50/60 rounded-xl border border-red-100 text-left cursor-pointer hover:bg-red-50"
              >
                <p className="font-bold text-xs text-red-950">{c.sfirst_name} {c.slast_name}</p>
                <p className="text-[10px] text-red-700 font-medium">Conflict found with another organization</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle size={24} className="text-emerald-500" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-800">No Scholarship Application Conflicts</h4>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">All monitored applications are in good standing.</p>
          </div>
        )}
      </section>

      {/* 3. Activity Log Section */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
          <h3 className="text-xs font-extrabold text-slate-900">Activity Log</h3>
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">6</span>
            <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>
        </div>

        <div className="space-y-3.5 flex-1 max-h-[320px] overflow-y-auto pr-1">
          {recentApplications.length === 0 ? (
            <>
              <ActivityItem name="AKO NATOY" program="Try Mo nga Ito" time="2 minutes ago" />
              <ActivityItem name="Hello Henryco" program="PROGRAM TEST" time="15 minutes ago" />
              <ActivityItem name="Hello Henryco" program="SWEEDY" time="1 hour ago" />
              <ActivityItem name="Juan Dela Cruz" program="STI College Scholarship Program" time="2 hours ago" />
              <ActivityItem name="Maria Santos" program="HSLAM" time="3 hours ago" />
            </>
          ) : (
            recentApplications.map((app, idx) => (
              <ActivityItem 
                key={app.id || idx}
                name={app.name} 
                program={app.program} 
                time={app.date} 
              />
            ))
          )}
        </div>

        <p className="text-[10px] font-bold text-slate-400 text-center mt-4">Showing latest activities</p>
      </section>

    </div>
  );
}

function ActivityItem({ name, program, time }) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
        <User size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-600 leading-snug">
          <span className="font-extrabold text-slate-900">{name}</span> submitted an application for <span className="font-bold text-slate-800">{program}</span>
        </p>
        <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">{time}</span>
      </div>
    </div>
  );
}