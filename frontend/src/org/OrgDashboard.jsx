import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, Calendar as CalendarIcon, GraduationCap, ClipboardCheck, FileText } from 'lucide-react';
import OrgRightBar from '../component/OrgRightBar';

export default function OrgDashboard() {
  const [stats, setStats] = useState({ acceptedStudents: 0, pendingApps: 0, totalPrograms: 0, draftPrograms: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Aggregated Metrics
        const resStats = await api.get('/organizations/dashboard-stats');
        setStats(resStats.data.data);
        const userId = localStorage.getItem('userId') || localStorage.getItem('orgId');

        if (!userId) {
          console.error("No user ID found in storage");
          return;
        }
        
        // 2. Fetch Recent Applications
        const resApps = await api.get('/organizations/applications');
        const allApplications = resApps.data.data;

        const mappedApps = allApplications.slice(0, 5).map(app => ({
          id: app.id,
          scholarship_id: app.scholarship_id,
          name: `${app.sfirst_name} ${app.slast_name}`,
          program: app.scholarship_name,
          date: new Date(app.submitted_at).toLocaleDateString(),
          hasConflict: app.conflicting_org !== null,
          conflicting_org: app.conflicting_org
        }));

        setRecentApplications(mappedApps);

        // 3. Fetch Programs for Sidebar/Deadlines
        const resProgs = await api.get(`/organizations/dashboard-programs/${userId}`); 
        setPrograms(resProgs.data.data);

      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-['Inter']">
        <div className="text-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">
          Initializing KyusISKO...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-['Inter'] relative">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Organization Overview
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Monitoring system is active.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
            Today's Date
          </p>
          <p className="text-lg font-black text-[#093fb4] uppercase tracking-tight">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* 4-Column Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard 
          icon={<Users />} 
          label="Students Approved" 
          value={stats.acceptedStudents || 0} 
          color="blue" 
        />
        <StatCard 
          icon={<ClipboardCheck />} 
          label="Pending Review" 
          value={stats.pendingApps || 0} 
          color="yellow" 
        />
        <StatCard 
          icon={<GraduationCap />} 
          label="Active Programs" 
          value={stats.totalPrograms || 0} 
          color="purple" 
        />
        <StatCard 
          icon={<FileText />} 
          label="Draft Programs" 
          value={stats.draftPrograms || 0} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  
        {/* Left Side: Both Tables side-by-side in a 2-column span block */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Upcoming Deadlines */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 h-full flex flex-col">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <CalendarIcon className="text-[#093fb4]" size={18} /> Upcoming Deadlines
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {programs.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 py-4 text-center">No upcoming deadlines configured.</p>
              ) : (
                programs.map(prog => (
                  <div key={prog.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm text-center min-w-[48px]">
                        <p className="text-[8px] font-black text-[#FF1E1E] uppercase tracking-wider leading-none mb-0.5">
                          {new Date(prog.deadline).toLocaleString('en-US', { month: 'short' })}
                        </p>
                        <p className="text-base font-black text-slate-900 leading-none">
                          {new Date(prog.deadline).getDate()}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-xs uppercase tracking-tight group-hover:text-[#093fb4] transition-colors truncate">
                          {prog.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Final date</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/ProgramView')} 
                      className="text-[#093fb4] font-black text-[10px] uppercase tracking-wider hover:text-[#FF1E1E] transition-all px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0 ml-2"
                    >
                      Manage
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Applicants Card Layout */}
          <section className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden h-full flex flex-col">
            <div className="p-6 pb-4 flex justify-between items-center">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Recent Applicants</h2>
              <button 
                onClick={() => navigate('/OrgApplicantPrograms')} 
                className="text-[10px] font-black text-[#093fb4] uppercase tracking-wider hover:text-[#FF1E1E] transition-colors"
              >
                View All
              </button>
            </div>
            
            <div className="p-6 pt-0 space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {recentApplications.map(app => (
                <div 
                  key={app.id}
                  onClick={() => navigate(`/OrgApplicantPrograms`)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group gap-2"
                >
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 text-sm truncate">{app.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight mt-0.5 truncate">{app.program}</p>
                  </div>
                  <div className="shrink-0">
                    {app.hasConflict ? (
                      <span className="inline-flex items-center text-[#FF1E1E] font-black text-[8px] uppercase tracking-wider bg-red-50 border border-red-100 px-2 py-1 rounded-full">
                        Conflict
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-emerald-600 font-black text-[8px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                        Clear
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Only pass recentApplications here */}
        <OrgRightBar recentApplications={recentApplications} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-[#093fb4] border-blue-100",
    yellow: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };
  
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3.5 rounded-xl border ${colors[color]} shrink-0`}>
        {React.cloneElement(icon, { size: 22, strokeWidth: 2.5 })}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}