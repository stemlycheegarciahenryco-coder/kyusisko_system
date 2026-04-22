import { useState, useEffect } from 'react';
import api from '../api';
import { Eye, CheckCircle, XCircle, Search, GraduationCap, ShieldCheck, Shield } from 'lucide-react';
import { STATUS_STYLES, STATUS_ICONS } from '../component/StatusStyles';
import StudentDetailModal from '../component/StudentDetailModal';
import  Swal from 'sweetalert2';

export default function RootStudentLog() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
 
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

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

 

  const closeDetailModal = () => {
    setSelected(null);
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleStatus = async (id, status) => {
  // 1. PRE-CLICK VALIDATION (Confirmation Dialog)
  const result = await Swal.fire({
    title: `Confirm ${status}?`,
    text: `Are you sure you want to mark this student as ${status}? An email notification will be sent immediately.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: status === 'approved' ? '#2563eb' : '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: `Yes, ${status} it!`,
    cancelButtonText: 'Cancel'
  });

  // If user clicked cancel, stop here
  if (!result.isConfirmed) return;

  setUpdating(id);
  try {
    const response = await api.patch(`/students/${id}/status`, { 
      status, 
      reason: status === 'rejected' ? rejectionReason : '' 
    });

    if (response.data) {
      // 2. SUCCESS DIALOG
      await Swal.fire({
        title: 'Action Successful!',
        text: `Student has been ${status} and the email was dispatched.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        borderRadius: '20px'
      });

      // Update local state to reflect change
      setStudents(prev => prev.map(s => s.id === id ? { ...s, sstatus: status } : s));
      setSelected(null); // Close modal
      setRejectionReason('');
      setShowRejectInput(false);
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      title: 'Error!',
      text: 'Something went wrong while updating the status.',
      icon: 'error'
    });
  } finally {
    setUpdating(null);
  }
};
  const filtered = students.filter(s => {
    const fullName = `${s.sfirst_name} ${s.slast_name}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase()) || 
                       s.student_email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.sstatus === filter;
    return matchSearch && matchFilter;
  });

  const getCount = (type) => type === 'all' ? students.length : students.filter(s => s.sstatus === type).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">
            Kyus<span className="text-blue-600">ISKO</span> Logs
          </h2>
          <p className="text-slate-400 text-sm font-bold flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Management & Verification Portal
          </p>
        </div>
        
        <div className="flex gap-3">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <div key={f} onClick={() => setFilter(f)} className={`cursor-pointer px-5 py-3 rounded-2xl border transition-all hover:scale-105 ${filter === f ? 'bg-slate-900 border-slate-900 shadow-lg shadow-slate-200' : 'bg-white border-slate-100'}`}>
              <p className={`text-xl font-black leading-none ${filter === f ? 'text-white' : 'text-slate-700'}`}>{getCount(f)}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-md group">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            placeholder="Search student identity or email..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium"
          />
        </div>
        
        <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-[1.5rem] w-full md:w-auto border border-slate-200/50">
          {['all', 'pending', 'approved', 'rejected', 'blocked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${filter === f ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Info</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-32"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="font-black text-slate-300 uppercase text-xs tracking-widest">Synchronizing Records...</p></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-32 text-slate-400 font-bold italic">No records match your current criteria.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition-all group cursor-default">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black shadow-inner border border-white">
                        {s.sfirst_name[0]}{s.slast_name[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">{s.sfirst_name} {s.slast_name}</p>
                        <p className="text-[11px] text-slate-400 font-bold lowercase mt-0.5">{s.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><GraduationCap size={16} /></div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase italic">{s.academic_category || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">{s.grade_level || 'Grade Level Unknown'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-xl border uppercase tracking-widest ${STATUS_STYLES[s.sstatus]}`}>
                      {STATUS_ICONS[s.sstatus]} {s.sstatus}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => setSelected(s)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-blue-100">
                        <Eye size={18}/>
                      </button>
                      
                      {s.sstatus === 'pending' && (
                        <>
                          <button onClick={() => handleStatus(s.id, 'approved')} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-emerald-100">
                            <CheckCircle size={18}/>
                          </button>
                          <button onClick={() => handleStatus(s.id, 'rejected')} className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-red-100">
                            <XCircle size={18}/>
                          </button>
                        </>
                      )}

                      {s.sstatus === 'approved' && (
                        <button onClick={() => handleStatus(s.id, 'blocked')} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200">
                          <Shield size={18}/>
                        </button>
                      )}

                      {s.sstatus === 'blocked' && (
                        <button onClick={() => handleStatus(s.id, 'unblocked')} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-emerald-200">
                          <ShieldCheck size={18}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMART MODAL INTEGRATION */}
      <StudentDetailModal 
        selected={selected}
        setSelected={closeDetailModal}
        handleStatus={handleStatus}
        updating={updating}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        showRejectInput={showRejectInput}
        setShowRejectInput={setShowRejectInput}
      />
    </div>
  );
}