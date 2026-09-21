import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X, Plus, Loader2 } from 'lucide-react';
import api from '../api';

const RELIGIONS = ["Roman Catholic", "Islam", "Iglesia ni Cristo", "Christianity"].sort();
const POPULAR_SPORTS = ["Basketball", "Volleyball", "Football", "Taekwondo", "Swimming", "Badminton", "Table Tennis", "Chess"];

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // --- DATABASE LOOKUP STATES ---
  const [dbSchools, setDbSchools] = useState([]);
  const [dbCourses, setDbCourses] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    college_id: '',       
    other_school: '',
    course_id: '',        
    other_course: '',
    is_athlete: '',       
    sports: [],
    other_sport: '',
    religion: '',         
    other_religion: '',
    is_indigenous: '',    
    indigenous_group: '',
    is_pwd: '',           
    is_working_student: '', 
    is_poverty_program: '', 
    program_type: '',
    other_program: ''
  });

  // --- FETCH LOOKUP ARRAYS FROM API ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [schoolsRes, coursesRes] = await Promise.all([
          api.get('/lookup/colleges'),
          api.get('/lookup/courses')
        ]);
        setDbSchools(schoolsRes.data);
        setDbCourses(coursesRes.data);
      } catch (error) {
        console.error("Error loading dropdown data from API:", error);
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchDropdownData();
  }, []);

  // --- MUTUALLY EXCLUSIVE SELECTION FOR STEP 1 & 2 ---
  const handleSelectChange = (field, value, clearField) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      [clearField]: '' 
    }));
  };

  const canProgress = () => {
    switch (step) {
      case 1: 
        return formData.college_id !== '';
      case 2: 
        return formData.course_id !== '';
      case 3: 
        if (formData.is_athlete === '') return false;
        if (formData.is_athlete === 'Yes' && formData.sports.length === 0) return false;
        if (formData.sports.includes('Others') && !formData.other_sport.trim()) return false;
        return true;
      case 4: 
        return formData.religion && (formData.religion !== 'Others' || formData.other_religion.trim() !== '');
      case 5: 
        if (formData.is_indigenous === '') return false;
        if (formData.is_indigenous === 'Yes' && !formData.indigenous_group.trim()) return false;
        return true;
      case 6: 
        return formData.is_pwd !== '';
      case 7: 
        return formData.is_working_student !== '';
      case 8: 
        if (formData.is_poverty_program === '') return false;
        if (formData.is_poverty_program === 'Yes') {
          return formData.program_type && (formData.program_type !== 'Others' || formData.other_program.trim() !== '');
        }
        return true;
      default:
        return false;
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setFormData(prev => ({ ...prev, college_id: 'NOT_ENROLLED', other_school: '' }));
    } else if (step === 2) {
      setFormData(prev => ({ ...prev, course_id: 'NOT_ENROLLED', other_course: '' }));
    } else if (step === 3) {
      setFormData(prev => ({ ...prev, is_athlete: 'No', sports: [], other_sport: '' }));
    }
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const nextStep = () => {
    if (canProgress()) {
      setStep(s => Math.min(s + 1, totalSteps));
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const toggleSport = (sport) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        college_id: (formData.college_id === 'NOT_ENROLLED' || formData.college_id === 'OTHERS') ? null : parseInt(formData.college_id, 10),
        other_school: formData.college_id === 'OTHERS' ? formData.other_school : (formData.college_id === 'NOT_ENROLLED' ? 'Currently not enrolled' : null),
        course_id: (formData.course_id === 'NOT_ENROLLED' || formData.course_id === 'OTHERS') ? null : parseInt(formData.course_id, 10),
        other_degree_program: formData.course_id === 'OTHERS' ? formData.other_course : (formData.course_id === 'NOT_ENROLLED' ? 'Currently not enrolled' : null),
        religion: formData.religion === 'Others' ? formData.other_religion : formData.religion,
        is_athlete: formData.is_athlete === 'Yes',
        sports_interests: formData.sports, 
        other_sport: formData.sports.includes('Others') ? formData.other_sport : null,
        is_indigenous: formData.is_indigenous === 'Yes',
        indigenous_group: formData.is_indigenous === 'Yes' ? formData.indigenous_group : null,
        is_pwd: formData.is_pwd === 'Yes',
        is_working_student: formData.is_working_student === 'Yes',
        is_poverty_program: formData.is_poverty_program === 'Yes',
        program_type: formData.is_poverty_program === 'Yes' ? formData.program_type : null,
        other_program: (formData.is_poverty_program === 'Yes' && formData.program_type === 'Others') ? formData.other_program : null
      };

      const res = await api.post('/student-onboarding-profile', payload);

      if (res.status === 200 && res.data.profile) {
        localStorage.setItem('isProfileComplete', 'true');
        navigate('/StudentProfile', { state: { justOnboarded: true }, replace: true });
      }
    } catch (err) {
      console.error("Submission failed:", err.response?.data || err.message);
      alert("Submission failed. Check your network or payload formatting.");
    }
  };

  // --- STYLING CONSTANTS ---
  const colors = { blue: '#093fb4' };
  const inputStyle = "w-full px-5 py-4 bg-black/5 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-black text-sm shadow-sm font-['Inter'] mt-2";
  const labelStyle = "text-[10px] font-black text-black uppercase ml-1 tracking-[0.2em] block mb-2";
  const unselectedBtn = "p-5 rounded-2xl font-black text-sm uppercase border-2 transition-all flex justify-between items-center border-transparent bg-black/5 text-black/40 hover:bg-black/10 hover:text-black/70";
  const selectedBtn = "p-5 rounded-2xl font-black text-sm uppercase border-2 transition-all flex justify-between items-center border-[#093fb4] bg-white text-[#093fb4] shadow-md";

  // --- NEW LOADING SCREEN ---
  if (loadingLookups) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 font-['Inter']">
        <div className="fixed inset-0 z-0 opacity-70" style={{ backgroundImage: `url('/memorial.jpg')`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
        <div className="relative z-10 flex flex-col items-center p-10 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border-4 border-white">
          <Loader2 size={56} className="animate-spin text-[#093fb4] mb-4" strokeWidth={2.5} />
          <h2 className="font-black text-black uppercase tracking-[0.2em] text-lg text-center">Loading</h2>
          <p className="text-xs text-black/50 font-bold mt-2 tracking-widest uppercase">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden font-['Inter']">
      
      {/* Background Image */}
      <div className="fixed inset-0 z-0 opacity-70" style={{ backgroundImage: `url('/memorial.jpg')`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />

      {/* Progress tracking line */}
      <div className="fixed top-8 w-full max-w-md px-6 z-10">
        <div className="h-3 w-full bg-white/80 backdrop-blur-md rounded-full overflow-hidden border-2 border-white shadow-sm">
          <motion.div animate={{ width: `${(step / totalSteps) * 100}%` }} className="h-full rounded-full" style={{ backgroundColor: colors.blue }} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 md:p-10 border-4 border-white">
        <div className="min-h-[360px] flex flex-col justify-center">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="KyusISKO Logo" className="h-16 w-auto object-contain drop-shadow-md" />
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: SCHOOLS */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>Current School or University</label>
                <select value={formData.college_id} onChange={(e) => handleSelectChange('college_id', e.target.value, 'other_school')} className={inputStyle}>
                  <option value="">Select School...</option>
                  {dbSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="OTHERS">Others (Please Specify)</option>
                  <option value="NOT_ENROLLED">Currently not enrolled</option>
                </select>
                {formData.college_id === 'OTHERS' && (
                  <input type="text" placeholder="Please specify your school" className={inputStyle} value={formData.other_school} onChange={(e) => setFormData({...formData, other_school: e.target.value})} />
                )}
              </motion.div>
            )}

            {/* STEP 2: DEGREE PROGRAMS */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>What is your Degree Program?</label>
                <select value={formData.course_id} onChange={(e) => handleSelectChange('course_id', e.target.value, 'other_course')} className={inputStyle}>
                  <option value="">Select Course...</option>
                  {dbCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="OTHERS">Others (Please Specify)</option>
                  <option value="NOT_ENROLLED">Currently not enrolled</option>
                </select>
                {formData.course_id === 'OTHERS' && (
                  <input type="text" placeholder="Specify your course" className={inputStyle} value={formData.other_course} onChange={(e) => setFormData({...formData, other_course: e.target.value})} />
                )}
              </motion.div>
            )}

            {/* STEP 3: ATHLETE STATUS */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>Are you a Student Athlete?</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setFormData({...formData, is_athlete: opt, sports: opt === 'No' ? [] : formData.sports})} className={formData.is_athlete === opt ? selectedBtn : unselectedBtn}>{opt}</button>
                  ))}
                </div>
                {formData.is_athlete === 'Yes' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <label className={labelStyle}>Select Sports</label>
                    <div className="flex flex-wrap gap-2 p-5 bg-black/5 rounded-[1.5rem] border-2 border-transparent max-h-[160px] overflow-y-auto custom-scrollbar">
                      {[...POPULAR_SPORTS, "Others"].map(sport => {
                        const isSelected = formData.sports.includes(sport);
                        return (
                          <button key={sport} onClick={() => toggleSport(sport)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border-2 ${isSelected ? 'bg-[#093fb4] text-white border-[#093fb4] shadow-md' : 'bg-white text-black/60 border-black/10 hover:border-black/20 hover:text-black'}`}>
                            {sport} {isSelected ? <X size={14} strokeWidth={3}/> : <Plus size={14} strokeWidth={3}/>}
                          </button>
                        )
                      })}
                    </div>
                    {formData.sports.includes('Others') && (
                      <input type="text" placeholder="Enter other sports..." className={inputStyle} value={formData.other_sport} onChange={(e) => setFormData({...formData, other_sport: e.target.value})} />
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: RELIGION */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>What is your Religion?</label>
                <select value={formData.religion} onChange={(e) => setFormData({...formData, religion: e.target.value, other_religion: ''})} className={inputStyle}>
                  <option value="">Select Religion...</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="Others">Others</option>
                </select>
                {formData.religion === 'Others' && (
                  <input type="text" placeholder="Specify your religion" className={inputStyle} value={formData.other_religion} onChange={(e) => setFormData({...formData, other_religion: e.target.value})} />
                )}
              </motion.div>
            )}

            {/* STEP 5: INDIGENOUS COMMUNITY */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>Are you part of an Indigenous Community?</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setFormData({...formData, is_indigenous: opt, indigenous_group: opt === 'No' ? '' : formData.indigenous_group})} className={formData.is_indigenous === opt ? selectedBtn : unselectedBtn}>{opt}</button>
                  ))}
                </div>
                {formData.is_indigenous === 'Yes' && (
                  <input type="text" placeholder="Enter Group Name..." className={inputStyle} value={formData.indigenous_group} onChange={(e) => setFormData({...formData, indigenous_group: e.target.value})} />
                )}
              </motion.div>
            )}

            {/* STEP 6: PWD FLAG */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>Are you a Person with Disability (PWD)?</label>
                <div className="grid grid-cols-1 gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setFormData({...formData, is_pwd: opt})} className={formData.is_pwd === opt ? selectedBtn : unselectedBtn}>
                      {opt} {formData.is_pwd === opt && <Check size={20} strokeWidth={2.5}/>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 7: WORKING STUDENT STATUS */}
            {step === 7 && (
              <motion.div key="s7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>Are you a Working Student?</label>
                <div className="grid grid-cols-1 gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setFormData({...formData, is_working_student: opt})} className={formData.is_working_student === opt ? selectedBtn : unselectedBtn}>
                      {opt} {formData.is_working_student === opt && <Check size={20} strokeWidth={2.5}/>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 8: POVERTY REDUCTION PROGRAM DETAILS */}
            {step === 8 && (
              <motion.div key="s8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <label className={labelStyle}>Is family part of Poverty Reduction Programs?</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setFormData({...formData, is_poverty_program: opt, program_type: '', other_program: ''})} className={formData.is_poverty_program === opt ? selectedBtn : unselectedBtn}>{opt}</button>
                  ))}
                </div>
                {formData.is_poverty_program === 'Yes' && (
                  <div className="space-y-2">
                    <select value={formData.program_type} onChange={(e) => setFormData({...formData, program_type: e.target.value, other_program: ''})} className={inputStyle}>
                      <option value="">Select Program...</option>
                      {['4PS (Pantawid Pamilyang Pilipino Program)', 'AKAP (Ayuda para sa Kapos Ang Kita Program)'
                        , ' AICS (Assistance to Individuals in Crisis Situations)', 'SLP (Sustainable Livelihood Program)',
                         'MaPa Program (Masayang Pamilya Para sa Batang Pilipino)', 'Others'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {formData.program_type === 'Others' && (
                      <input type="text" placeholder="Specify program name" className={inputStyle} value={formData.other_program} onChange={(e) => setFormData({...formData, other_program: e.target.value})} />
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTROLS FOOTER */}
        <div className="flex gap-4 mt-8 pt-6 border-t-2 border-black/5">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/10 hover:text-black transition-all flex items-center justify-center border-2 border-transparent">
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* HIGH VISIBILITY SKIP BUTTON */}
          {[1, 2, 3].includes(step) && (
            <button onClick={handleSkip} className="flex-1 py-4 bg-white text-[#093fb4] border-2 border-[#093fb4] hover:bg-[#093fb4] hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center shadow-sm hover:shadow-[#093fb4]/25">
              Skip
            </button>
          )}

          <button 
            onClick={step === totalSteps ? handleSubmit : nextStep}
            disabled={!canProgress()}
            className={`flex-[3] py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all 
              ${!canProgress() ? 'bg-black/20 text-white/50 cursor-not-allowed' : 'bg-[#093fb4] hover:bg-[#073496] shadow-xl shadow-[#093fb4]/25 active:scale-95'}`}
          >
            {step === totalSteps ? <><Check size={20} strokeWidth={2.5} /> Complete</> : <><ArrowRight size={20} strokeWidth={2.5} /> Next</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;