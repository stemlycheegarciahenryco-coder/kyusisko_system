import { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, Zap, Clock, Target } from 'lucide-react';
import api from '../api';

export default function SuperAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dynamic Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.get('/super/audit-trails').then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.data;
      setLogs(data || []);
    });
  }, []);

  const getActionBadge = (action) => {
    const base = "px-2.5 py-1 rounded-md text-[10px] font-black tracking-tighter uppercase border ";
    const act = action?.toUpperCase() || "";
    if (act.includes('DELETE') || act.includes('BLOCK') || act.includes('REJECT')) {
      return base + "bg-rose-50 text-rose-600 border-rose-100";
    }
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('RESTORE') || act.includes('APPLY')) {
      return base + "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('RENEWAL')) {
      return base + "bg-amber-50 text-amber-600 border-amber-100";
    }
    return base + "bg-slate-50 text-slate-600 border-slate-200";
  };

  const filteredLogs = logs.filter(log => 
    log.initiator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans w-full">
      
      {/* 1. Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Security <span className="text-blue-600">Audit Trail</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic">Full system transparency active.</p>
        </div>

        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-200 items-center">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
               <input 
                 type="text" 
                 placeholder="Search logs..." 
                 className="pl-10 pr-4 py-2 w-64 bg-transparent text-sm focus:outline-none"
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
        </div>
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricBox 
            icon={<Zap className="text-amber-500"/>} 
            label="Total Actions" 
            value={logs.length} 
        />
        <MetricBox 
            icon={<History className="text-blue-500"/>} 
            label="Today's Activity" 
            value={logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} 
        />
        <MetricBox 
            icon={<Clock className="text-emerald-500"/>} 
            label="System Time" 
            value={currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
        />
      </div>

      {/* 3. Enhanced Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-[12%]">Timestamp</th>
                <th className="px-6 py-5 w-[20%]">Initiator</th>
                <th className="px-6 py-5 w-[13%]">Operation</th>
                <th className="px-6 py-5 w-[20%]">Target Entity</th>
                <th className="px-6 py-5 w-[35%]">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/40 transition-all group">
                  {/* Timestamp */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-slate-900 font-bold">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Initiator (Who did it) */}
                  <td className="px-6 py-4">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
      {log.initiator_name?.charAt(0).toUpperCase()}
    </div>
    <div className="flex flex-col truncate">
      {/* Shows the actual Org or Student Name */}
      <span className="text-xs font-bold text-slate-800 truncate">
        {log.initiator_name}
      </span>
      <span className="text-[9px] text-blue-600 font-black uppercase tracking-tighter">
        {log.actor_role?.replace('_', ' ')}
      </span>
    </div>
  </div>
</td>

                  {/* Operation Badge */}
                  <td className="px-6 py-4">
                    <span className={getActionBadge(log.action_type)}>{log.action_type}</span>
                  </td>

                  {/* Target (What was affected) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                          <Target size={12} />
                       </div>
                       <span className="text-xs font-bold text-slate-700">
    {log.target_display_name}
  </span>
                    </div>
                  </td>

                  {/* Details */}
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-600 font-medium leading-relaxed">
                      {log.details}
                    </span>
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

function MetricBox({ icon, label, value }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}