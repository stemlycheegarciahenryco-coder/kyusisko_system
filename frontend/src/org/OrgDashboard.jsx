import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  ClipboardCheck, 
  FileText, 
  GraduationCap, 
  Users, 
  Download, 
  MoreVertical,
  Megaphone,
  ChevronDown,
  Clock
} from 'lucide-react';
import OrgRightBar from '../component/OrgRightBar';
// ADDED: Import the modal component (check this path is correct for your setup!)
import ForcePasswordChange from '../component/ForcePasswordChange'; 

// ─── SVG Donut Chart Component ───────────────────────────────────────────────
function ProgramOverviewChart({ active = 0, apps = 0, drafts = 0, pending = 0 }) {
  const total = active + apps + drafts + pending;

  const data = [
    { label: 'Active Programs', count: active, color: '#A855F7' },   // Purple
    { label: 'Total Applications', count: apps, color: '#3B82F6' },  // Blue
    { label: 'Draft Programs', count: drafts, color: '#22C55E' },   // Green
    { label: 'Pending Review', count: pending, color: '#F97316' },  // Orange
  ];

  let cumulativePercent = 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Program Overview</h2>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 px-2.5 py-1 rounded-lg">
          This Month <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
        {/* Donut Graphic */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
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
            <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight mt-1">Total Programs</span>
          </div>
        </div>

        {/* Dynamic Legend */}
        <div className="flex-1 space-y-3 w-full">
          {data.map((item, idx) => {
            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-bold">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 mr-1">{item.count}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">({percentage}%)</span>
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
  // ADDED: Synchronous state check. It fires immediately before rendering.
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
        <div className="text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-50/50 min-h-screen font-sans">
      
      {/* ADDED: The Modal conditionally renders here */}
      {needsPasswordChange && (
        <ForcePasswordChange onComplete={() => setNeedsPasswordChange(false)} />
      )}

      {/* ADDED: Wrapped dashboard content in a div that blurs if needsPasswordChange is true */}
      <div className={`p-8 space-y-6 transition-all duration-300 ${needsPasswordChange ? 'blur-sm pointer-events-none select-none' : ''}`}>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               Dashboard
            </h1>
          </div>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all w-fit"
          >
            <Download size={15} /> Export Report
          </button>
        </div>

        {/* Main Grid: Left Dashboard Area & Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (2 Cols Wide) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                icon={<ClipboardCheck size={20} className="text-amber-500" />}
                iconBg="bg-amber-50"
                label=" Application Pending Review"
                value={stats.pendingApps ?? 0}
                change="Active applications"
                changeColor="text-amber-600"
              />
              <MetricCard 
                icon={<FileText size={20} className="text-emerald-500" />}
                iconBg="bg-emerald-50"
                label="Draft Programs"
                value={stats.draftPrograms ?? 0}
                change="Saved drafts"
                changeColor="text-emerald-600"
              />
              <MetricCard 
                icon={<GraduationCap size={20} className="text-purple-500" />}
                iconBg="bg-purple-50"
                label="Active Programs"
                value={stats.activePrograms ?? 0}
                change="Published programs"
                changeColor="text-purple-600"
              />
              <MetricCard 
                icon={<Users size={20} className="text-blue-500" />}
                iconBg="bg-blue-50"
                label="Total Applications"
                value={stats.totalActiveApps ?? 0}
                change="All time received"
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
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-sm font-extrabold text-slate-900">Program Status & Applicants</h2>
                  <button 
                    onClick={() => navigate('/ProgramView')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All Programs
                  </button>
                </div>

                <div className="space-y-3">
                  {programs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-bold text-xs">
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

              <div className="mt-6 text-center pt-2">
                <button 
                  onClick={() => navigate('/ProgramView')}
                  className="text-xs font-bold text-blue-600 bg-blue-50/60 hover:bg-blue-100/60 px-5 py-2 rounded-xl transition-all"
                >
                  View All Programs
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1">
            <OrgRightBar recentApplications={recentApplications} programs={programs} />
          </div>

        </div>

        {/* Bottom Stay Updated Banner */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
              <Megaphone size={18} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Stay Updated!</h4>
              <p className="text-[11px] font-medium text-slate-500">Keep track of your programs and applicant activities.</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/create-scholarship')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
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
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3.5">
        <div className={`p-3 rounded-xl ${iconBg} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">{label}</p>
          <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{value}</p>
          <p className={`text-[10px] font-bold ${changeColor} mt-1`}>{change}</p>
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
    ? 'bg-amber-50 text-amber-600 border border-amber-100'
    : isActive
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
      : 'bg-slate-200/60 text-slate-600';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100/80 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg shrink-0 ${iconStyle}`}>
          {isExpired ? <Clock size={16} /> : isActive ? <GraduationCap size={16} /> : <FileText size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeStyle}`}>
          {status}
        </span>

        <div className="text-right">
          <p className="text-xs font-black text-slate-900">{applicants}</p>
          <p className="text-[9px] font-semibold text-slate-400">Applicants</p>
        </div>

        <button 
          onClick={() => navigate('/ProgramView')}
          className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Manage
        </button>

        <button className="text-slate-400 hover:text-slate-600 p-1">
          <MoreVertical size={15} />
        </button>
      </div>
    </div>
  );
}