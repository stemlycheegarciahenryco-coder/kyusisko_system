import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  ClipboardCheck, 
  FileText, 
  GraduationCap, 
  Users, 
  MoreVertical,
  Megaphone,
  ChevronDown,
  Clock
} from 'lucide-react';
import OrgRightBar from '../component/OrgRightBar';
import ForcePasswordChange from '../component/ForcePasswordChange'; 

// ─── SVG Donut Chart Component ───────────────────────────────────────────────
function ProgramOverviewChart({ active = 0, apps = 0, drafts = 0, pending = 0 }) {
  const total = active + apps + drafts + pending;

  const data = [
    { label: 'Active Programs', count: active, color: '#A855F7' },
    { label: 'Total Applications', count: apps, color: '#3B82F6' },
    { label: 'Draft Programs', count: drafts, color: '#22C55E' },
    { label: 'Pending Review', count: pending, color: '#F97316' },
  ];

  let cumulativePercent = 0;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">Program Overview</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 my-auto">
        {/* Donut Graphic */}
        <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {total > 0 ? (
              data.map((item, index) => {
                const percent = (item.count / total) * 100;
                const strokeDasharray = `${percent} ${100 - percent}`;
                const strokeDashoffset = 100 - cumulativePercent;
                cumulativePercent += percent;

                return (
                  <circle
                    key={index}
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="5"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    pathLength="100"
                    className="transition-all duration-500 ease-out"
                  />
                );
              })
            ) : (
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="5"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-slate-900 leading-none">{total}</span>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-1.5">Total Programs</span>
          </div>
        </div>

        {/* Dynamic Legend */}
        <div className="flex-1 space-y-3.5 w-full">
          {data.map((item, idx) => {
            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={idx} className="flex items-center justify-between text-xs md:text-sm font-semibold">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-800 font-bold">{item.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900 mr-1.5">{item.count}</span>
                  <span className="text-xs text-slate-400 font-bold">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Org Dashboard Page ──────────────────────────────────────────────────
export default function OrgDashboard() {
  const [needsPasswordChange, setNeedsPasswordChange] = useState(() => {
    const orgInfo = JSON.parse(localStorage.getItem('orgInfo') || '{}');
    return orgInfo.isPasswordChanged === false;
  });

  const [stats, setStats] = useState({ 
    pendingApps: 0, 
    draftPrograms: 0, 
    activePrograms: 0, 
    totalActiveApps: 0 
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const resStats = await api.get('/organizations/dashboard-stats');
        if (resStats?.data?.data) {
          setStats(resStats.data.data);
        }

        const resApps = await api.get('/organizations/applications');
        const mappedApps = (resApps.data?.data || []).slice(0, 5).map(app => ({
          id: app.id,
          scholarship_id: app.scholarship_id,
          name: `${app.sfirst_name} ${app.slast_name}`,
          program: app.scholarship_name,
          date: new Date(app.submitted_at).toLocaleDateString(),
          hasConflict: app.conflicting_org !== null,
        }));
        setRecentApplications(mappedApps);

        const resProgs = await api.get('/organizations/dashboard-programs/me');
        setPrograms(resProgs.data?.data || []);
      } catch (err) {
        console.error("Dashboard Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center font-sans">
        <div className="text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest text-sm">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-50/50 min-h-screen font-sans">
      
      {needsPasswordChange && (
        <ForcePasswordChange onComplete={() => setNeedsPasswordChange(false)} />
      )}

      <div className={`p-6 md:p-8 space-y-8 transition-all duration-300 ${needsPasswordChange ? 'blur-sm pointer-events-none select-none' : ''}`}>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               Dashboard
            </h1>
          </div>
        </div>

        {/* Main Grid: Left Dashboard Area & Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            
            {/* Top Metric Cards - Responsive Grid Fix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard 
                icon={<ClipboardCheck size={22} className="text-amber-500" />}
                iconBg="bg-amber-50"
                label=" Review Pending"
                value={stats.pendingApps ?? 0}
                change="Pending "
                changeColor="text-amber-600"
              />
              <MetricCard 
                icon={<FileText size={22} className="text-emerald-500" />}
                iconBg="bg-emerald-50"
                label="Draft Programs"
                value={stats.draftPrograms ?? 0}
                change="Saved drafts"
                changeColor="text-emerald-600"
              />
              <MetricCard 
                icon={<GraduationCap size={22} className="text-purple-500" />}
                iconBg="bg-purple-50"
                label="Active Programs"
                value={stats.activePrograms ?? 0}
                change="Publish"
                changeColor="text-purple-600"
              /> 
              <MetricCard 
                icon={<Users size={22} className="text-blue-500" />}
                iconBg="bg-blue-50"
                label="Total Applications"
                value={stats.totalActiveApps ?? 0}
                change="Applications"
                changeColor="text-blue-600"
              />
            </div>

            {/* Program Overview Donut Chart */}
            <ProgramOverviewChart 
              active={stats.activePrograms ?? 0} 
              apps={stats.totalActiveApps ?? 0} 
              drafts={stats.draftPrograms ?? 0} 
              pending={stats.pendingApps ?? 0} 
            />

            {/* Program Status & Applicants Table */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-base md:text-lg font-black text-slate-900">Program Status & Applicants</h2>
                  <button 
                    onClick={() => navigate('/ProgramView')}
                    className="text-xs md:text-sm font-bold text-blue-600 hover:underline"
                  >
                    View All Programs
                  </button>
                </div>

                <div className="space-y-3.5">
                  {programs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold text-sm">
                      No programs created yet. Click "Create New Program" below to add one.
                    </div>
                  ) : (
                    programs.slice(0, 5).map(prog => (
                      <ProgramRow 
                        key={prog.id} 
                        title={prog.title} 
                        status={(prog.status || 'active').toUpperCase().replace('_', ' ')} 
                        applicants={prog.total_applicants || 0}
                        navigate={navigate}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 text-center pt-2">
                <button 
                  onClick={() => navigate('/ProgramView')}
                  className="text-xs md:text-sm font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-6 py-2.5 rounded-xl transition-all"
                >
                  View All Programs
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 min-w-0">
            <OrgRightBar recentApplications={recentApplications} programs={programs} />
          </div>

        </div>

        {/* Bottom Stay Updated Banner */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-xl shrink-0">
              <Megaphone size={22} />
            </div>
            <div>
              <h4 className="text-sm md:text-base font-black text-slate-900">Open Scholarship Now!</h4>
              <p className="text-xs md:text-sm font-medium text-slate-600 mt-0.5">Quick Creation of Scholarship Programs</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/create-scholarship')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-extrabold px-6 py-3 rounded-xl shadow-md transition-all shrink-0"
          >
            Create New Program
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
function MetricCard({ icon, iconBg, label, value, change, changeColor }) {
  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between min-w-0">
      <div className="flex items-center gap-3 min-w-0 w-full">
        <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-tight leading-snug line-clamp-2">{label}</p>
          <p className="text-xl md:text-2xl font-black text-slate-900 leading-tight mt-1">{value}</p>
          <p className={`text-[10px] md:text-xs font-bold ${changeColor} mt-0.5 truncate`}>{change}</p>
        </div>
      </div>
    </div>
  );
}

function ProgramRow({ title, status, applicants, navigate }) {
  const isActive = status === 'ACTIVE' || status === 'OPEN';
  const isExpired = status === 'DEADLINE PASSED';

  const iconStyle = isExpired
    ? 'bg-amber-50 text-amber-600'
    : isActive
      ? 'bg-purple-50 text-purple-600'
      : 'bg-emerald-50 text-emerald-600';

  const badgeStyle = isExpired
    ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
    : isActive
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
      : 'bg-slate-200/80 text-slate-700';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-100/60 rounded-2xl border border-slate-200/60 transition-all gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${iconStyle}`}>
          {isExpired ? <Clock size={18} /> : isActive ? <GraduationCap size={18} /> : <FileText size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-bold text-slate-900 truncate">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${badgeStyle}`}>
          {status}
        </span>

        <div className="text-right">
          <p className="text-xs md:text-sm font-black text-slate-900">{applicants}</p>
          <p className="text-[10px] md:text-xs font-bold text-slate-400">Applicants</p>
        </div>

        <button 
          onClick={() => navigate('/ProgramView')}
          className="text-xs font-bold text-blue-600 bg-blue-50/80 px-3.5 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
        >
          Manage
        </button>

        <button className="text-slate-400 hover:text-slate-600 p-1">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}