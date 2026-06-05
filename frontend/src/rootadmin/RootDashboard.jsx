import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, ClipboardList, UserCog, GraduationCap, UserPlus, ShieldAlert, Building2 } from 'lucide-react';
import api from '../api';

const STAT_CARDS = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { key: 'totalSubAdmins', label: 'Active Orgs', icon: UserCog, color: 'bg-amber-50 text-amber-600' },
  { key: 'totalScholarships', label: 'Scholarship Programs', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'totalApplications', label: 'Total Applications', icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
];

export default function RootDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Co-Admin Feature Management States
  const [coAdmins, setCoAdmins] = useState([]);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [formMessage, setFormMessage] = useState('');
  
  const userRole = localStorage.getItem('userRole') || 'co_admin';
  const systemUid = localStorage.getItem('systemUid') || '';

  const PIE_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#7c3aed'];

  useEffect(() => {
    fetchStatsAndAdmins();
  }, []);

  const fetchStatsAndAdmins = async () => {
    try {
      setLoading(true); 
      const resStats = await api.get('/stats');
      setStats(resStats.data);

      if (userRole === 'root_admin') {
        const resAdmins = await api.get('/system-admin/co-admins');
        if (resAdmins.data.success) {
          setCoAdmins(resAdmins.data.data);
        }
      }
    } catch (err) { 
      console.error("Failed to load root parameters:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreateCoAdmin = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const response = await api.post('/system-admin/create-co-admin', formData);
      if (response.data.success) {
        const createdAdmin = response.data.data;
        setFormMessage(`✅ Registered! Generated ID: ${createdAdmin.uid}`);
        setCoAdmins([createdAdmin, ...coAdmins]);
        setFormData({ firstName: '', lastName: '', email: '', password: '' });
      }
    } catch (err) {
      setFormMessage(`❌ ${err.response?.data?.message || 'Failed to register account.'}`);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const response = await api.patch(`/system-admin/toggle-status/${id}`, { status: nextStatus });
      if (response.data.success) {
        setCoAdmins(coAdmins.map(admin => admin.id === id ? { ...admin, account_status: nextStatus } : admin));
      }
    } catch (err) {
      console.error("Could not complete requested state transition:", err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-['Inter']">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
            System Admin<span className="text-blue-600"> Dashboard</span>
          </h1>
        </div>
      </div>

      {/* Main Grid Component Segment Workspace */}
      <div className={`grid grid-cols-1 gap-8 items-start ${userRole === 'root_admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        
        {/* Left Side Section: Metrics Matrix Cards, Pie Graph & Overviews */}
        <div className={`${userRole === 'root_admin' ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-6`}>
          
          {/* Stat Cards Grid */}
          <div className={`grid grid-cols-1 gap-4 ${userRole === 'root_admin' ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
            {STAT_CARDS.map((card) => (
              <div key={card.key} className="bg-white p-6 rounded-[2rem] border border-blue-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}>
                    <card.icon size={22}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                    <p className="text-2xl font-black text-slate-800">{loading ? '...' : stats?.[card.key]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🎯 NEW SIDE-BY-SIDE SIDEBAR WORKSPACE SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            
            {/* Narrow Pie Chart Card Container */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-blue-400 shadow-sm flex flex-col justify-between min-h-[360px] xl:col-span-1">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">
                  Data Distribution
                </h4>
              </div>
              <div className="flex-1 h-56 min-w-0">
                {!loading && stats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Students', value: stats.totalStudents || 0 },
                          { name: 'Organizations', value: stats.totalSubAdmins || 0 },
                          { name: 'Scholarships', value: stats.totalScholarships || 0 },
                        ]}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300 italic text-xs">
                    {loading ? "Calculating Data..." : "No distribution data available"}
                  </div>
                )}
              </div>
            </div>

            {/* Overviews Flex Container Column taking up remaining space beside the chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:col-span-2">
              
              {/* Recent Registered Students */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14} className="text-blue-600" /> Recent Students Overview
                  </h3>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-xs text-slate-400 italic py-2">Loading registrations...</p>
                    ) : !stats?.recentStudents || stats.recentStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No students listed.</p>
                    ) : (
                      stats.recentStudents.map((student) => (
                        <div key={student.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-xs font-bold text-slate-800 uppercase truncate max-w-[130px]">
                            {student.first_name} {student.last_name}
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md tracking-wider">
                            {student.uid || `ID-${student.id}`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Scholarship Providers */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building2 size={14} className="text-amber-600" /> Recent Providers Overview
                  </h3>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-xs text-slate-400 italic py-2">Loading providers...</p>
                    ) : !stats?.recentProviders || stats.recentProviders.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No providers active.</p>
                    ) : (
                      stats.recentProviders.map((provider) => (
                        <div key={provider.id} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                            {provider.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {provider.email}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Side Section: Conditional Co-Admin Workspace Container */}
        {userRole === 'root_admin' && (
          <div className="lg:col-span-1">
            <section className="bg-white p-6 rounded-[2.5rem] border border-blue-200 shadow-sm">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={18} /> Co-Admin Management
              </h2>

              <form onSubmit={handleCreateCoAdmin} className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="First Name" 
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                  />
                  <input 
                    type="text" 
                    placeholder="Last Name" 
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                />
                <input 
                  type="password" 
                  placeholder="Password Security Field" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                />
                
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Create Co-Admin Account
                </button>

                {formMessage && (
                  <p className="text-[10px] font-black text-center uppercase tracking-tight mt-2 text-blue-600 bg-blue-50/50 py-1.5 rounded-lg">
                    {formMessage}
                  </p>
                )}
              </form>

              <div className="border-t border-slate-100 pt-4 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  System Co-Admins Status
                </p>
                
                {loading ? (
                  <p className="text-xs font-medium text-slate-400 italic text-center py-2">Loading administrators...</p>
                ) : coAdmins.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 italic py-2 text-center">No co-admins created yet.</p>
                ) : (
                  coAdmins.map(admin => (
                    <div key={admin.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-slate-800 text-xs uppercase tracking-tight truncate">
                            {admin.first_name} {admin.last_name}
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md tracking-wider">
                            {admin.uid}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                          {admin.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(admin.id, admin.account_status)}
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          admin.account_status === 'active'
                            ? 'bg-white text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200'
                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                        }`}
                      >
                        {admin.account_status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}