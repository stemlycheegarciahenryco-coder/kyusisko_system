import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Edit3, Trash2, Layout, ArrowRight, Clock } from 'lucide-react';
import api from './api'; 
import CreateProgramModal from './component/CreateProgramModal';
import EditProgramDetail from './component/EditProgramDetail';

const ScholarshipManager = () => {
  const [scholarships, setScholarships] = useState([]);
  const [editingSchool, setEditingSchool] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);    
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const response = await api.get('/scholarships');
        setScholarships(response.data.data || []); 
      } catch (err) {
        console.error("Fetch error", err);
      }
    };
    fetchScholarships();
  }, []);

  const addScholarshipToList = (newlyCreated) => {
    setScholarships(prev => [...prev, newlyCreated]);
  };

  const updateScholarshipList = (updated) => {
    setScholarships(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const openEditModal = (scholarship) => {
    setEditingSchool(scholarship);
    setShowEditModal(true);
  };

  const handlePublish = async (id) => {
    if (!window.confirm("Ready to make this scholarship live for students?")) return;
    try {
      const response = await api.patch(`/scholarships/${id}/status`, { status: 'open' });
      updateScholarshipList(response.data.data);
      alert("Scholarship is now LIVE!");
    } catch (err) {
      console.error("Publishing error", err);
      alert("Failed to publish: " + (err.response?.data?.message || "Check console"));
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage <span className="text-blue-600">Scholarships</span></h1>
            <p className="text-slate-500 font-medium">Create and manage your organization's offerings</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            Post New Program
          </button>
        </div>

        {/* Scholarship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.map((s) => {
            // DEADLINE CHECK LOGIC
            const isPastDeadline = new Date() > new Date(s.deadline);

            return (
              <div key={s.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group ${isPastDeadline ? 'border-red-100 opacity-90' : 'border-slate-200 hover:border-blue-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    {/* STATUS BADGE */}
                    <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      isPastDeadline 
                        ? 'bg-red-100 text-red-600' 
                        : s.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {isPastDeadline ? '● Closed (Deadline Passed)' : `● ${s.status}`}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tight">
                      <Calendar size={12} /> Ends {new Date(s.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors leading-tight">{s.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 italic">"{s.description}"</p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-auto">
                  {/* Show Publish ONLY if status is 'draft' AND deadline hasn't passed */}
                  {s.status === 'draft' && !isPastDeadline && (
                    <button 
                      onClick={() => handlePublish(s.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 animate-pulse hover:animate-none"
                    >
                      <ArrowRight size={14} /> PUBLISH PROGRAM
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => window.location.href = `/builder/${s.id}`}
                      disabled={isPastDeadline}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
                        isPastDeadline ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <Layout size={14} /> Form Builder
                    </button>
                    <button 
                      onClick={() => openEditModal(s)}
                      className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
                    >
                      {isPastDeadline ? 'Renew Deadline' : 'Edit Details'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <CreateProgramModal 
          onClose={() => setShowModal(false)} 
          onSuccess={addScholarshipToList} 
        />
      )}

      {showEditModal && editingSchool && (
        <EditProgramDetail
          scholarship={editingSchool}
          onClose={() => setShowEditModal(false)}
          onSuccess={updateScholarshipList}
        />
      )}
    </div>
  );
};

export default ScholarshipManager;