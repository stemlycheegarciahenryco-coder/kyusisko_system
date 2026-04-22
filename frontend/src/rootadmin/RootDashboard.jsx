import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, ClipboardList, UserCog, GraduationCap, Archive, Ban } from 'lucide-react';
import api from '../api';
import Calendar from './DashboardCalendar';

// Updated Stat Cards Definition
const STAT_CARDS = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { key: 'totalSubAdmins', label: 'Active Orgs', icon: UserCog, color: 'bg-amber-50 text-amber-600' },
  { key: 'totalScholarships', label: 'Scholarship Programs', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'totalApplications', label: 'Total Applications', icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
];

export default function RootDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const PIE_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#7c3aed'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">Root<span className="text-blue-600">Overview</span></h1>
          <p className="text-slate-400 text-sm font-medium italic">KyusISKO System Intelligence</p>
        </div>
        <button onClick={fetchStats} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Refresh Data</button>
      </div>

      {/* Grid: Stats & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stat Cards - 3/4 Width */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}><card.icon size={22}/></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <p className="text-2xl font-black text-slate-800">{loading ? '...' : stats?.[card.key]}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Spike Chart Area */}
          
<div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-64 min-h-[300px]">
  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">System Composition</h4>
  
  {!loading && stats ? (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[
            { name: 'Students', value: stats.totalStudents },
            { name: 'Organizations', value: stats.totalSubAdmins },
            { name: 'Scholarships', value: stats.totalScholarships },
          ]}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={8}
          dataKey="value"
        >
          {PIE_COLORS.map((color, index) => (
            <Cell key={`cell-${index}`} fill={color} stroke="none" />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Legend verticalAlign="bottom" iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-full text-slate-300 italic text-xs">
      {loading ? "Calculating Data..." : "No distribution data"}
    </div>
  )}
</div>
        </div>

        {/* Quick Actions - 1/4 Width */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Management</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group text-left">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-xl group-hover:scale-110 transition-transform"><Archive size={16}/></div>
                <div>
                  <p className="text-xs font-bold">Archive Students</p>
                  <p className="text-[9px] text-slate-500 font-medium italic underline">Bulk deactivate inactive</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group text-left">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform"><Ban size={16}/></div>
                <div>
                  <p className="text-xs font-bold">Org Restrictions</p>
                  <p className="text-[9px] text-slate-500 font-medium italic underline">Review flagged programs</p>
                </div>
              </button>
            </div>
          </div>
          <Calendar />
        </div>
      </div>
    </div>
  );
}