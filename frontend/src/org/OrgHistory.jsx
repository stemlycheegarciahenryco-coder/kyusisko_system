import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, Eye, Trash2, Calendar, Users } from 'lucide-react';
import api from '../api';
import ViewProgram from '../component/ViewProgram';

export default function OrgHistory() {
  const navigate = useNavigate();
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => { fetchArchived(); }, []);

  const fetchArchived = async () => {
    try {
      const res = await api.get('/scholarships/get-all');
      const archivedOnly = (res.data.data || []).filter(s => s.status === 'archived');
      setArchived(archivedOnly);
    } catch (err) {
      console.error("Fetch archived error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this archived scholarship?")) {
      await api.delete(`/scholarships/${id}`);
      fetchArchived();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFFCFB]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-[#FFFCFB] min-h-screen font-['Inter']">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-black/40 hover:text-[#093fb4] font-black text-[11px] uppercase tracking-widest mb-4 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="text-5xl lg:text-6xl font-black text-black tracking-tighter leading-tight">
              Archived <br />
              <span className="text-[#093fb4]">Scholarships</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-black/5 px-6 py-4 rounded-2xl">
            <Archive size={20} className="text-black/40" />
            <span className="text-[11px] font-black uppercase tracking-widest text-black/40">
              {archived.length} Archived
            </span>
          </div>
        </div>

        {/* Empty State */}
        {archived.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Archive size={32} className="text-slate-300" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              No archived scholarships yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {archived.map((s) => (
              <div key={s.id} className="bg-white border-[3px] border-gray-100 rounded-[2.5rem] p-8 flex flex-col shadow-sm hover:shadow-xl transition-all group">

                {/* Archive Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border bg-slate-50 text-slate-400 border-slate-100">
                    ● Archived
                  </span>
                </div>

                <h3 className="text-2xl font-black text-black mb-3 tracking-tight line-clamp-1 group-hover:text-[#093fb4] transition-colors uppercase">
                  {s.title}
                </h3>
                <p className="text-black/60 text-sm font-medium mb-4 flex-grow line-clamp-3 leading-relaxed">
                  {s.description}
                </p>

                {/* Meta info */}
                <div className="flex gap-3 mb-6">
                  {s.deadline && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-black/30 uppercase tracking-widest">
                      <Calendar size={12} /> {new Date(s.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  {s.slots && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-black/30 uppercase tracking-widest">
                      <Users size={12} /> {s.slots} slots
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewModal(s)}
                    className="flex-[3] py-4 bg-gray-50 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={16} strokeWidth={3} /> View
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="flex-1 py-4 bg-red-50 text-[#FF1E1E] rounded-2xl hover:bg-[#FF1E1E] hover:text-white transition-all flex items-center justify-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {viewModal && <ViewProgram scholarship={viewModal} onClose={() => setViewModal(null)} />}
    </div>
  );
}