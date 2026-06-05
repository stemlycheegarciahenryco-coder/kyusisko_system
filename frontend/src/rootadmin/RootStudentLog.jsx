import { useState, useEffect } from 'react';
import api from '../api';
import { Search, ShieldCheck, Lock, Phone, MapPin, Mail } from 'lucide-react';
import Swal from 'sweetalert2';

export default function RootStudentLog() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleStatus = async (id, currentActiveStatus) => {
    const newStatus = !currentActiveStatus;
    const actionText = newStatus ? 'Unblock' : 'Block';

    const result = await Swal.fire({
      title: `${actionText} Student?`,
      text: `Confirm you want to ${actionText.toLowerCase()} this account's access.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#093fb4' : '#FF1E1E',
      confirmButtonText: `Yes, ${actionText}!`,
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/students/${id}/status`, { activeStatus: newStatus });
      setStudents(prev => prev.map(s => s.id === id ? { ...s, sis_active: newStatus } : s));
      Swal.fire({ title: 'Success!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: 'Error!', icon: 'error' });
    }
  };

  const filtered = students.filter(s => {
    const fullName = `${s.sfirst_name} ${s.slast_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || s.student_email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 bg-[#FFFCFB] min-h-screen p-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-[#093fb4]/10 shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">
            Student Management
          </h2>
          <p className="text-black/60 text-sm font-bold flex items-center gap-2 mt-1">
       
            
          </p>
        </div>
        <div className="px-5 py-3 rounded-2xl border border-[#093fb4] bg-white shadow-sm">
          <p className="text-xl font-black leading-none text-[#093fb4]">{students.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-black mt-1">Total Student in Registered</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative w-full md:max-w-md">
        <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40" />
        <input
          placeholder="Search student identity..."
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-[#093fb4]/20 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#093fb4]/10 text-black font-medium"
        />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-[#093fb4]/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#093fb4]/5 border-b border-[#093fb4]/10">
                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Student</th>
                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Contact & Email</th>
                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Address</th>
                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Status</th>
                
                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#093fb4]/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 text-black font-bold uppercase tracking-widest">Loading...</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-[#FFFCFB] transition-all group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#093fb4] flex items-center justify-center text-white font-black text-xs">
                        {s.sfirst_name[0]}{s.slast_name[0]}
                      </div>
                      <div>
                        <p className="font-black text-black text-sm uppercase">{s.sfirst_name} {s.slast_name}</p>
                        <p className="text-[10px] text-black/40 font-bold">ID: #{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-black/60">
                        <Mail size={12} className="text-[#093fb4]" />
                        <span className="text-[11px] font-bold">{s.student_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-black/60">
                        <Phone size={12} className="text-[#093fb4]" />
                        <span className="text-[11px] font-bold">{s.scontact_number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-start gap-2 max-w-[200px]">
                      <MapPin size={12} className="text-[#FF1E1E] mt-1 shrink-0" />
                      <span className="text-[11px] font-medium text-black/70 leading-tight">
                        {s.full_address || 'No Address Provided'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.sis_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-black uppercase ${s.sis_active ? 'text-green-600' : 'text-red-600'}`}>
                        {s.sis_active ? 'Active' : 'Blocked'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleStatus(s.id, s.sis_active)} 
                        className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                          !s.sis_active 
                            ? 'bg-[#FF1E1E] border-[#FF1E1E] text-white' 
                            : 'bg-white text-black hover:border-[#FF1E1E] hover:text-[#FF1E1E]'
                        }`}
                      >
                        {!s.sis_active ? <ShieldCheck size={16}/> : <Lock size={16}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}