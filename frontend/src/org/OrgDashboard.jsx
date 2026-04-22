import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Users, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  ClipboardCheck, 
  Clock,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function OrgDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, pendingApps: 0, totalPrograms: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const resStats = await api.get('/scholarships');
        const scholarData = resStats.data.data;
        
        const resApps = await api.get('/orgs/applications'); 
        const allApplications = resApps.data.data;

        const totalAccepted = scholarData.reduce((acc, curr) => acc + parseInt(curr.accepted_count || 0), 0);
        const totalPending = scholarData.reduce((acc, curr) => acc + parseInt(curr.pending_count || 0), 0);

        setPrograms(scholarData);
        setStats({
          totalPrograms: scholarData.length,
          totalStudents: totalAccepted,
          pendingApps: totalPending 
        });

        const detectedConflicts = allApplications.filter(app => app.conflicting_org !== null);
        setConflicts(detectedConflicts);

        setRecentApplications(allApplications.slice(0, 5).map(app => ({
          id: app.id,
          scholarship_id: app.scholarship_id, 
          name: `${app.sfirst_name} ${app.slast_name}`,
          program: app.scholarship_name,
          date: new Date(app.submitted_at).toLocaleDateString(),
          hasConflict: app.conflicting_org !== null
        })));

      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-bounce">Initializing KyusISKO...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Overview</h1>
          <p className="text-slate-500">Welcome back! Monitoring system is active.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Today's Date</p>
          <p className="text-lg font-black text-blue-600">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<Users />} label="Total Scholars" value={stats.totalStudents} color="blue" />
        <StatCard icon={<ClipboardCheck />} label="Pending Review" value={stats.pendingApps} color="yellow" />
        <StatCard icon={<GraduationCap />} label="Active Programs" value={stats.totalPrograms} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Deadlines */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <CalendarIcon className="text-blue-600" /> Upcoming Deadlines
            </h2>
            <div className="space-y-4">
              {programs.map(prog => (
                <div key={prog.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-center min-w-[50px]">
                      <p className="text-[10px] font-bold text-red-500 uppercase">{new Date(prog.deadline).toLocaleString('en-us', {month:'short'})}</p>
                      <p className="text-lg font-black text-slate-800">{new Date(prog.deadline).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{prog.title}</p>
                      <p className="text-xs text-slate-400">Final date for submission</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/scholarship/${prog.id}/applications`)} className="text-blue-600 font-bold text-sm hover:underline">Manage</button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Applications Table */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Recent Applicants</h2>
              {/* Corrected path to match App.jsx :mode */}
              <button onClick={() => navigate('/SelectScholarship/applicants')} className="text-sm font-bold text-blue-600">View All</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Applied Program</th>
                  <th className="px-6 py-4">Integrity</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map(app => (
                  <tr 
                    key={app.id} 
                    onClick={() => navigate(`/scholarship/${app.scholarship_id}/applications`)}
                    className="hover:bg-blue-50/50 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-700">{app.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{app.program}</td>
                    <td className="px-6 py-4">
                      {app.hasConflict ? (
                        <span className="flex items-center gap-1 text-rose-600 font-bold text-[10px] uppercase bg-rose-50 px-2 py-1 rounded-md w-fit">
                          <AlertTriangle size={12} /> Conflict
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase bg-emerald-50 px-2 py-1 rounded-md w-fit">
                          <CheckCircle size={12} /> Clear
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="space-y-8">
          {/* Professional Integrity Section */}
          <div className={`p-8 rounded-3xl text-white shadow-xl relative overflow-hidden transition-all duration-500 bg-slate-900 border-t-4 ${conflicts.length > 0 ? 'border-rose-500' : 'border-blue-500'}`}>
            <ShieldAlert className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5" />
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <ShieldAlert size={20} className={conflicts.length > 0 ? "text-rose-400" : "text-blue-400"} /> 
              Integrity Monitor
            </h3>

            {conflicts.length > 0 ? (
              <div className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  System has flagged <span className="text-rose-400 font-bold">{conflicts.length} applicants</span> with potential cross-program conflicts.
                </p>
                <div className="space-y-2">
                  {conflicts.slice(0, 2).map(c => (
                    <div key={c.id} className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <p className="font-bold text-xs uppercase text-slate-100">{c.sfirst_name} {c.slast_name}</p>
                      <p className="text-[10px] text-rose-300">Existing: {c.conflicting_org}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/SelectScholarship/applicants')} 
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg"
                >
                  Audit Conflicts
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center text-emerald-400 opacity-80"><CheckCircle size={48} /></div>
                <p className="text-slate-400 text-sm">No cross-program conflicts found in current batch.</p>
                <button 
                  onClick={() => navigate('/SelectScholarship/applicants')} 
                  className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm border border-slate-700 hover:bg-slate-750 transition-all"
                >
                  View Applicants
                </button>
              </div>
            )}
          </div>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-400 uppercase mb-4 tracking-widest">Quick Actions</h3>
            <div className="grid gap-3">
              <ActionButton label="Export Data" onClick={() => {}} />
              <ActionButton label="Broadcast Email" onClick={() => {}} />
              <ActionButton label="System Settings" onClick={() => navigate('/OrgSettings')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600"
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>{React.cloneElement(icon, { size: 28 })}</div>
      <div>
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 font-bold text-slate-600 border border-transparent hover:border-slate-100 transition-all flex justify-between items-center group">
      {label}
      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
    </button>
  );
}