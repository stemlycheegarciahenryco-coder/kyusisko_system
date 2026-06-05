import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, UserPlus, Clock, Bell, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function OrgRightBar({ recentApplications = [] }) {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    // 1. FETCH & DEDUPLICATE CONFLICTS
    const fetchConflicts = async () => {
      try {
        const response = await api.get('/organizations/conflicts');
        
        const grouped = response.data.data.reduce((acc, current) => {
          const studentKey = `${current.sfirst_name} ${current.slast_name}`;
          
          if (!acc[studentKey]) {
            acc[studentKey] = {
              id: current.id,
              scholarship_id: current.scholarship_id,
              name: studentKey,
              orgs: new Set()
            };
          }
          if (current.conflicting_org) {
            acc[studentKey].orgs.add(current.conflicting_org);
          }
          return acc;
        }, {});

        const deduplicated = Object.values(grouped).map(c => ({
          ...c,
          conflicting_orgs_list: c.orgs.size > 0 
            ? Array.from(c.orgs).join(', ') 
            : 'External Scholarship Office'
        }));

        setConflicts(deduplicated);
      } catch (err) {
        console.error("Error fetching conflicts in RightBar:", err);
      } finally {
        setLoadingConflicts(false);
      }
    };

    // 2. FETCH SYSTEM TAKEDOWN ALERTS
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notif/org');
        const data = response.data.data || [];
        setSystemNotifications(data);
      } catch (err) {
        console.error("Error fetching org notifications:", err);
        setSystemNotifications([]);
      } finally {
        setLoadingNotifs(false);
      }
    };

    fetchConflicts();
    fetchNotifications();
  }, []);

  // Merge student applications and admin takedowns into a single timestamp-sorted activity feed
  const combinedActivities = [
    ...recentApplications.map(app => ({
      ...app,
      activityType: 'application',
      sortDate: new Date(app.date || Date.now())
    })),
    ...systemNotifications.map(notif => ({
      id: notif.id,
      activityType: 'takedown',
      message: notif.message,
      title: notif.title,
      sortDate: new Date(notif.created_at),
      dateString: new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  const totalUnreadCount = recentApplications.length + systemNotifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 h-full flex flex-col justify-start">

      {/* Conflicts Layout Section */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
          <ShieldAlert size={16} className="text-red-500" /> Conflicts
        </h3>

        {loadingConflicts ? (
          <div className="text-center py-8 text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">
            Checking conflicts...
          </div>
        ) : conflicts.length > 0 ? (
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {conflicts.map(c => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/scholarship/${c.scholarship_id}/applicants`)}
                className="p-3 bg-red-50/50 rounded-xl border border-red-100 hover:border-red-200 transition-all cursor-pointer hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-red-950">{c.name}</p>
                  <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide scale-90">Conflict</span>
                </div>
                <p className="text-[11px] text-red-800/80 mt-1 font-medium leading-relaxed">
                  Conflicting org: <span className="font-bold text-red-900">{c.conflicting_orgs_list}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
            <CheckCircle size={28} className="text-emerald-500 mb-2 opacity-85" />
            <p className="text-xs font-bold text-slate-400">No organizational conflicts</p>
          </div>
        )}
      </section>

      {/* Unified Activity Log & Notification Feed */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider select-none">Activity Log</h3>
          <div className="relative p-1.5 bg-slate-50 rounded-xl">
            <Bell size={16} className="text-slate-600" />
            {totalUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-ping"></span>
            )}
          </div>
        </div>
        
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {loadingNotifs ? (
            <div className="text-center py-8 text-xs font-bold text-slate-400 animate-pulse tracking-widest uppercase">
              Loading Logs...
            </div>
          ) : combinedActivities.length > 0 ? (
            combinedActivities.map((activity, idx) => {
              const isTakedown = activity.activityType === 'takedown';
              
              return (
                <div 
                  key={activity.id || idx} 
                  className={`flex gap-3 p-2.5 rounded-xl transition-all border border-transparent ${
                    isTakedown 
                      ? 'bg-amber-50/40 hover:bg-amber-50/80 hover:border-amber-100' 
                      : 'hover:bg-slate-50/80 hover:border-slate-100'
                  } cursor-pointer group`} 
                  onClick={() => {
                    if (!isTakedown) {
                      navigate(`/scholarship/${activity.scholarship_id}/applicants`);
                    }
                  }}
                >
                  {/* Icon Frame Block */}
                  <div className={`p-2 rounded-lg h-fit border shrink-0 transition-transform ${
                    isTakedown 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {isTakedown ? <AlertTriangle size={14} /> : <UserPlus size={14} />}
                  </div>

                  {/* Dynamic Alert Messages */}
                  <div className="flex-1 min-w-0">
                    {isTakedown ? (
                      <div className="text-xs">
                        <span className="font-extrabold text-amber-800 uppercase tracking-wider text-[9px] bg-amber-100 px-1.5 py-0.5 rounded-md block w-fit mb-1.5">
                          System Action
                        </span>
                        <p className="text-slate-700 font-medium leading-relaxed break-words pr-1">{activity.message}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed break-words">
                        <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{activity.name}</span> submitted an application for <span className="font-bold text-slate-800">{activity.program}</span>
                      </p>
                    )}
                    
                    <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-tight">
                      <Clock size={11} className="text-slate-300" /> 
                      {isTakedown ? activity.dateString : activity.date}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase">
              No recent logs found
            </div>
          )}
        </div>
      </section>

    </div>
  );
}