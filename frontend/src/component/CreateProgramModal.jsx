import React, { useState } from 'react';
import api from '../api';
import { X, ArrowRight, ArrowLeft, CheckCircle2, GraduationCap } from 'lucide-react';

const CreateProgramModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [gwaEnabled, setGwaEnabled] = useState(false); // New Toggle State
  const [newScholarship, setNewScholarship] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'draft',
    min_gwa_requirement: ''
  });

  const levels = ["Elementary", "Junior High", "Senior High", "Tertiary"];

  const toggleLevel = (level) => {
    if (level === "All") {
      setSelectedLevels(levels);
    } else if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter(item => item !== level));
    } else {
      setSelectedLevels([...selectedLevels, level]);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    const adminId = localStorage.getItem('userId');
    try {
      const payload = {
        ...newScholarship,
        target_academic_level: selectedLevels.join(', '),
        // Send GWA only if the toggle is ON
        min_gwa_requirement: gwaEnabled ? newScholarship.min_gwa_requirement : null,
        sub_admin_id: adminId,
        status: 'draft'
      };

      const response = await api.post('/scholarships-create', payload);
      onSuccess(response.data.data);
      onClose();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Check console"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg flex flex-col max-h-[90vh] shadow-2xl border border-blue-50 overflow-hidden">
        
        {/* Header */}
        <div className="p-10 pb-4 flex-shrink-0 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Step {step} of 2</p>
            <h2 className="text-2xl font-black text-slate-800">
              {step === 1 ? "Program Basics" : "Academic Rules"}
            </h2>
          </div>
          <div className="flex gap-1 mb-1">
             <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-100'}`}></div>
             <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-100'}`}></div>
          </div>
        </div>
        
        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-10 pb-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Program Title</label>
                <input 
                  required
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 focus:border-blue-500 outline-none" 
                  placeholder="e.g. Quezon City Excellence Award"
                  value={newScholarship.title}
                  onChange={(e) => setNewScholarship({...newScholarship, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Description</label>
                <textarea 
                  required
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 focus:border-blue-500 outline-none h-32" 
                  placeholder="What is this scholarship for?"
                  value={newScholarship.description}
                  onChange={(e) => setNewScholarship({...newScholarship, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Application Deadline</label>
                <input 
                  type="date" required
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 focus:border-blue-500 outline-none"
                  value={newScholarship.deadline}
                  onChange={(e) => setNewScholarship({...newScholarship, deadline: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Target Levels</label>
                <div className="flex flex-wrap gap-2 mb-3 mt-2 p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  {selectedLevels.map(lvl => (
                    <span key={lvl} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2">
                      {lvl} <X size={14} className="cursor-pointer" onClick={() => toggleLevel(lvl)} />
                    </span>
                  ))}
                  {selectedLevels.length === 0 && <span className="text-slate-400 text-xs">Pick at least one...</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggleLevel("All")} className="px-4 py-2 rounded-xl text-[10px] font-black bg-slate-900 text-white hover:scale-105 transition-all">OPEN TO ALL</button>
                  {levels.map(lvl => !selectedLevels.includes(lvl) && (
                    <button key={lvl} type="button" onClick={() => toggleLevel(lvl)} className="px-4 py-2 rounded-xl text-[10px] font-black border-2 border-slate-100 bg-white hover:border-blue-400 transition-all">+ {lvl}</button>
                  ))}
                </div>
              </div>

              {/* GWA TOGGLE BOX */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${gwaEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase">GWA Requirement</p>
                      <p className="text-[9px] text-slate-400 font-bold">SET MINIMUM GRADE TO QUALIFY</p>
                    </div>
                  </div>
                  {/* Modern Toggle Switch */}
                  <button 
                    type="button"
                    onClick={() => setGwaEnabled(!gwaEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${gwaEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${gwaEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {gwaEnabled && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                    <input 
                      type="number" step="0.01" required
                      placeholder="Enter Min. GWA (e.g. 1.75)"
                      className="w-full bg-white border-2 border-blue-100 rounded-2xl p-4 focus:border-blue-500 outline-none"
                      value={newScholarship.min_gwa_requirement}
                      onChange={(e) => setNewScholarship({...newScholarship, min_gwa_requirement: e.target.value})}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 pt-4 flex-shrink-0 bg-white border-t border-slate-50 flex gap-4">
          {step === 1 ? (
            <>
              <button type="button" onClick={onClose} className="flex-1 font-bold text-slate-400">Cancel</button>
              <button 
                type="button" 
                disabled={!newScholarship.title || !newScholarship.deadline}
                onClick={() => setStep(2)}
                className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep(1)} className="flex-1 font-bold text-slate-400 flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                type="button" 
                onClick={handleCreate}
                disabled={loading || selectedLevels.length === 0 || (gwaEnabled && !newScholarship.min_gwa_requirement)}
                className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                {loading ? "Processing..." : "Finish & Create"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProgramModal;