import { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserPlus, ShieldCheck, Activity, 
  Eye, EyeOff, Ban, Unlock, Key, RefreshCw, 
  Users, Building2, GraduationCap, X
} from 'lucide-react';
import api from '../api';

export default function SuperRootConsole() {
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({ students: 0, orgs: 0, scholarships: 0 });
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal States
  const [resetModal, setResetModal] = useState({ open: false, adminId: null, email: '' });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchAdmins();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/super/system-stats');
      setStats(res.data);
    } catch (err) { console.error("Stats fail"); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/super/admins');
      setAdmins(res.data);
    } catch (err) { console.error("Fetch fail"); }
  };

  const handleCreateRoot = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Authorize ${formData.email} as a System Admin?`)) return;
    setLoading(true);
    try {
      await api.post('/super/create-root', formData);
      setFormData({ email: '', password: '' });
      await fetchAdmins();
    } catch (err) { alert(err.response?.data?.error || "Failed"); }
    finally { setLoading(false); }
  };

  const toggleBlock = async (id, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const actionLabel = newStatus === 'blocked' ? 'BLOCK' : 'UNBLOCK';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} this administrator?`)) return;

    try {
      await api.patch(`/super/admin-status/${id}`, { status: newStatus });
      fetchAdmins();
    } catch (err) {
        console.log(err.response?.data)
         alert("Action failed"); }
  };

  const handlePasswordReset = async () => {
    try {
      await api.patch(`/super/reset-password/${resetModal.adminId}`, { password: newPassword });
      alert("Password updated successfully");
      setResetModal({ open: false, adminId: null, email: '' });
      setNewPassword('');
    } catch (err) { alert("Reset failed"); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* STATS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Students', val: stats.students, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Organizations', val: stats.orgs, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Active Scholarships', val: stats.scholarships, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-5 shadow-sm">
            <div className={`p-4 ${s.bg} ${s.color} rounded-2xl`}><s.icon size={28}/></div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-slate-800">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500 rounded-lg animate-pulse"><ShieldAlert size={20}/></div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-red-400">Security & Credentials</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">KyusISKO</h1>
        </div>
        <ShieldCheck className="absolute right-[-20px] top-[-20px] text-white/5" size={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PROVISIONING FORM */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm self-start">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-600"/> Provision System Admin
          </h3>
          <form onSubmit={handleCreateRoot} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Login Email</label>
              <input 
                type="email" placeholder="admin@kyusisko.sys" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 ring-blue-500/20"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Initial Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm pr-12"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="animate-spin" size={16}/> : 'Authorize Credentials'}
            </button>
          </form>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-6">Management Panel</h3>
          <div className="space-y-3">
            {admins.map(adm => (
              <div key={adm.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${adm.account_status === 'blocked' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-black ${adm.account_status === 'blocked' ? 'text-red-600' : 'text-slate-700'}`}>{adm.email}</p>
                    {adm.account_status === 'blocked' && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase font-black">Blocked</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Admin Node</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setResetModal({ open: true, adminId: adm.id, email: adm.email })} className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100 transition-all"><Key size={18}/></button>
                  <button 
                    onClick={() => toggleBlock(adm.id, adm.account_status)}
                    className={`p-3 rounded-xl shadow-sm border transition-all ${adm.account_status === 'blocked' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-400 hover:text-red-600 border-slate-100'}`}
                  >
                    {adm.account_status === 'blocked' ? <Unlock size={18}/> : <Ban size={18}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PASSWORD RESET MODAL */}
      {resetModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setResetModal({ open: false })} className="absolute right-6 top-6 text-slate-300 hover:text-slate-600"><X size={24}/></button>
            <h2 className="text-xl font-black text-slate-800 mb-2 italic uppercase">Reset Password</h2>
            <p className="text-sm text-slate-400 mb-6 font-medium">Changing credentials for <span className="text-blue-600 font-bold">{resetModal.email}</span></p>
            <input 
              type="password" placeholder="New Secret Password" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-4 text-sm"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
            />
            <button onClick={handlePasswordReset} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700">Confirm Global Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}