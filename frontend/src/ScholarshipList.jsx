import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from './api';
import { BookOpen, Calendar, ArrowRight, Award, MapPin, X, Sparkles, LayoutGrid, Filter, Info } from 'lucide-react';

export default function ScholarshipList() {
  const [scholarships, setScholarships] = useState([]);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecommended, setIsRecommended] = useState(true); 
  const [showNavWarning, setShowNavWarning] = useState(false); // For Browse All warning
  const navigate = useNavigate();

  const backendURL = "http://localhost:5000";

  const fetchScholarships = async (recommendedMode) => {
  setLoading(true);
  try {
    const studentId = localStorage.getItem('studentId');
    const endpoint = recommendedMode 
      ? `/recommendations/${studentId}` 
      : `/recommendations/all`;
      
    const res = await api.get(endpoint);
    const data = recommendedMode ? res.data?.recommendations : (res.data?.scholarships || res.data);
    
    // --- DEADLINE FILTER ---
    const now = new Date();
    const filteredData = Array.isArray(data) 
      ? data.filter(s => new Date(s.deadline) > now) 
      : [];
    
    setScholarships(filteredData);
  } catch (err) {
    console.error("Failed to load scholarships", err);
    setScholarships([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchScholarships(isRecommended);
  }, [isRecommended]);

  // Handle clicking Browse All
  const handleBrowseAllClick = () => {
    if (isRecommended) {
      setShowNavWarning(true);
    }
  };

  const confirmBrowseAll = () => {
    setIsRecommended(false);
    setShowNavWarning(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Curating your feed...</p>
    </div>
  );

  return (
    <div className="pb-20">
      {/* FEED HEADER - Sticky under the Top Nav */}
      <div className="sticky top-0 z-30 bg-[#F0F2F5]/80 backdrop-blur-md px-4 py-4 mb-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Explore Programs</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Feed</p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setIsRecommended(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all ${
                isRecommended ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'
              }`}
            >
              <Sparkles size={12} /> FOR YOU
            </button>
            <button 
              onClick={handleBrowseAllClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all ${
                !isRecommended ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'
              }`}
            >
              <LayoutGrid size={12} /> BROWSE ALL
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto mt-6 px-4 space-y-6">
        {scholarships.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
            <p className="font-black text-slate-400 uppercase tracking-widest">No scholarships found.</p>
          </div>
        ) : (
          scholarships.map((s) => (
            <div key={s.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-500 group">
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-blue-100 border-2 border-white shrink-0">
                      {s.donor_photo ? (
                        <img 
                          src={`${backendURL}/${s.donor_photo}`} 
                          alt="Donor" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
                          <Award size={28} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {s.title}
                      </h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter flex items-center gap-1">
                         <MapPin size={12}/> Verified Donor Program
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">
                    {s.target_academic_level}
                  </span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 italic">
                  "{s.description}"
                </p>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-xs font-bold">Ends {new Date(s.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={16} className="text-green-500" />
                    <span className="text-xs font-bold">Req. GWA: {s.min_gwa_requirement}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedScholarship(s)}
                  className="w-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-900 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs border border-slate-100 group-hover:border-blue-600"
                >
                  View Details <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* NAVIGATION MODE WARNING DIALOG */}
      {showNavWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 text-center shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Navigation Mode</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              You are entering a navigation mode which can browse and see other open scholarships but <span className="text-slate-900 font-bold">cannot apply</span>.
            </p>
            <div className="flex gap-3">
               <button 
                onClick={() => setShowNavWarning(false)}
                className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBrowseAll}
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-slate-900 shadow-lg shadow-blue-100 transition-all uppercase text-xs tracking-widest"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] max-w-lg w-full shadow-2xl overflow-hidden relative">
            
            <div className="h-40 bg-slate-900 relative flex items-center justify-center">
              {selectedScholarship.donor_photo && (
                <img 
                  src={`${backendURL}/${selectedScholarship.donor_photo}`} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[2px]"
                  alt="background"
                />
              )}
              <div className="relative z-10 w-full px-8 flex justify-between items-center">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-2xl">
                  <BookOpen size={32} className="text-white" />
                </div>
                <button 
                  onClick={() => setSelectedScholarship(null)}
                  className="bg-white/10 hover:bg-red-500 backdrop-blur-md p-3 rounded-full border border-white/20 text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-10 -mt-10 bg-white rounded-t-[3rem] relative z-20">
              <div className="mb-6">
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">
                  {selectedScholarship.title}
                </h2>
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
                   Official Selection Program
                </p>
              </div>

              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {selectedScholarship.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 block mb-1 tracking-widest uppercase">GWA Req</span>
                  <span className="text-xl font-black text-blue-600">
                    {selectedScholarship.min_gwa_requirement || "No Req"}
                  </span>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 block mb-1 tracking-widest uppercase">Target Level</span>
                  <span className="text-xl font-black text-slate-900">
                    {selectedScholarship.target_academic_level}
                  </span>
                </div>
              </div>

              {/* Application Button - Only Navigates if in Recommended Mode */}
              <button 
                onClick={() => !isRecommended ? setSelectedScholarship(null) : navigate(`/apply/${selectedScholarship.id}`)}
                className={`w-full font-black py-5 rounded-[2rem] transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-2 group ${
                  !isRecommended 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-slate-900 shadow-blue-100'
                }`}
              >
                {!isRecommended ? 'Application Locked' : 'Start Application'} 
                {isRecommended && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}