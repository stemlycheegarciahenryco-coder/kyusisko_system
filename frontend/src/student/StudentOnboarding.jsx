import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconCheck, IconX, IconPlus } from '@tabler/icons-react';
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
    college_id: '',       // Stores Integer ID or 'NOT_ENROLLED' or 'OTHERS'
    other_school: '',
    course_id: '',        // Stores Integer ID or 'NOT_ENROLLED' or 'OTHERS'
    other_course: '',
    is_athlete: '',       // 'Yes' or 'No'
    sports: [],
    other_sport: '',
    religion: '',         // String value or 'Others'
    other_religion: '',
    is_indigenous: '',    // 'Yes' or 'No'
    indigenous_group: '',
    is_pwd: '',           // 'Yes' or 'No'
    is_working_student: '', // 'Yes' or 'No'
    is_poverty_program: '', // 'Yes' or 'No'
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
      [clearField]: '' // Wipes away previous text specifications safely
    }));
  };

  const canProgress = () => {
    switch (step) {
      case 1: // School (Skippable)
        return formData.college_id !== '';
      case 2: // Course (Skippable)
        return formData.course_id !== '';
      case 3: // Athlete (Skippable)
        if (formData.is_athlete === '') return false;
        if (formData.is_athlete === 'Yes' && formData.sports.length === 0) return false;
        if (formData.sports.includes('Others') && !formData.other_sport.trim()) return false;
        return true;
      case 4: // Religion
        return formData.religion && (formData.religion !== 'Others' || formData.other_religion.trim() !== '');
      case 5: // Indigenous
        if (formData.is_indigenous === '') return false;
        if (formData.is_indigenous === 'Yes' && !formData.indigenous_group.trim()) return false;
        return true;
      case 6: // PWD
        return formData.is_pwd !== '';
      case 7: // Working Student
        return formData.is_working_student !== '';
      case 8: // Poverty Program
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
      const sID = localStorage.getItem('studentId');
      if (!sID) {
        alert("Session expired. Please log in again.");
        return;
      }

      // Format payload keys explicitly to map to your database schema types
      const payload = {
        student_id: parseInt(sID, 10),
        college_id: (formData.college_id === 'NOT_ENROLLED' || formData.college_id === 'OTHERS') ? null : parseInt(formData.college_id, 10),
        other_school: formData.college_id === 'OTHERS' ? formData.other_school : (formData.college_id === 'NOT_ENROLLED' ? 'Currently not enrolled' : null),
        course_id: (formData.course_id === 'NOT_ENROLLED' || formData.course_id === 'OTHERS') ? null : parseInt(formData.course_id, 10),
        other_degree_program: formData.course_id === 'OTHERS' ? formData.other_course : (formData.course_id === 'NOT_ENROLLED' ? 'Currently not enrolled' : null),
        religion: formData.religion === 'Others' ? formData.other_religion : formData.religion,
        is_athlete: formData.is_athlete === 'Yes',
        sports_interests: formData.sports, // Direct array passing matches jsonb field configuration
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

      if (res.status === 201 || res.data.success) {
        localStorage.setItem('isProfileComplete', 'true');
        navigate('/scholarships');
      }
    } catch (err) {
      console.error("Submission failed:", err.response?.data || err.message);
      alert("Submission failed. Check your network or payload formatting.");
    }
  };

  const colors = { blue: '#093fb4' };
  const inputStyle = "w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#093fb4]/20 focus:border-[#093fb4] outline-none font-bold text-base transition-all text-black mt-2";
  const labelStyle = "text-sm font-black uppercase text-black ml-1 mb-3 block tracking-wider";

  if (loadingLookups) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-[#093fb4]">
        Syncing with Database Repositories...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-70" style={{ backgroundImage: `url('/memorial.jpg')`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />

      {/* Progress tracking line */}
      <div className="fixed top-10 w-full max-w-md px-6 z-10">
        <div className="h-3 w-full bg-white/60 backdrop-blur-md rounded-full overflow-hidden border border-white/20 shadow-inner">
          <motion.div animate={{ width: `${(step / totalSteps) * 100}%` }} className="h-full rounded-full" style={{ backgroundColor: colors.blue }} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/40 backdrop-blur-sm rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] p-10 border border-white">
        <div className="min-h-[340px] flex flex-col justify-center">
          <div className="flex flex-col items-center mb-10">
            <img src="/logo.png" alt="KyusISKO Logo" className="h-20 w-auto object-contain drop-shadow-md" />
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
                    <button key={opt} onClick={() => setFormData({...formData, is_athlete: opt, sports: opt === 'No' ? [] : formData.sports})} className={`p-4 rounded-2xl font-black text-sm uppercase border-2 transition-all ${formData.is_athlete === opt ? 'border-[#093fb4] bg-blue-50 text-[#093fb4]' : 'border-slate-100 text-black'}`}>{opt}</button>
                  ))}
                </div>
                {formData.is_athlete === 'Yes' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <label className="text-[11px] font-black text-black uppercase ml-1 tracking-[0.2em]">Select Sports</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 max-h-[150px] overflow-y-auto text-black">
                      {[...POPULAR_SPORTS, "Others"].map(sport => (
                        <button key={sport} onClick={() => toggleSport(sport)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${formData.sports.includes(sport) ? 'bg-[#093fb4] text-white' : 'bg-white text-black border border-slate-200'}`}>
                          {sport} {formData.sports.includes(sport) ? <IconX size={12}/> : <IconPlus size={12}/>}
                        </button>
                      ))}
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
                    <button key={opt} onClick={() => setFormData({...formData, is_indigenous: opt, indigenous_group: opt === 'No' ? '' : formData.indigenous_group})} className={`p-4 rounded-2xl font-black text-sm uppercase border-2 transition-all ${formData.is_indigenous === opt ? 'border-[#093fb4] bg-blue-50 text-[#093fb4]' : 'border-slate-100 text-black'}`}>{opt}</button>
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
                    <button key={opt} onClick={() => setFormData({...formData, is_pwd: opt})} className={`p-5 rounded-2xl font-black text-sm uppercase border-2 transition-all flex justify-between items-center ${formData.is_pwd === opt ? 'border-[#093fb4] bg-blue-50 text-[#093fb4]' : 'border-slate-100 text-black'}`}>
                      {opt} {formData.is_pwd === opt && <IconCheck size={20}/>}
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
                    <button key={opt} onClick={() => setFormData({...formData, is_working_student: opt})} className={`p-5 rounded-2xl font-black text-sm uppercase border-2 transition-all flex justify-between items-center ${formData.is_working_student === opt ? 'border-[#093fb4] bg-blue-50 text-[#093fb4]' : 'border-slate-100 text-black'}`}>
                      {opt} {formData.is_working_student === opt && <IconCheck size={20}/>}
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
                    <button key={opt} onClick={() => setFormData({...formData, is_poverty_program: opt, program_type: '', other_program: ''})} className={`p-4 rounded-2xl font-black text-sm uppercase border-2 transition-all ${formData.is_poverty_program === opt ? 'border-[#093fb4] bg-blue-50 text-[#093fb4]' : 'border-slate-100 text-black'}`}>{opt}</button>
                  ))}
                </div>
                {formData.is_poverty_program === 'Yes' && (
                  <div className="space-y-2">
                    <select value={formData.program_type} onChange={(e) => setFormData({...formData, program_type: e.target.value, other_program: ''})} className={inputStyle}>
                      <option value="">Select Program...</option>
                      {['4PS (Pantawid Pamilyang Pilipino Program)', 'AKAP', 'AICS', 'SLP', '4PH', 'Others'].map(p => <option key={p} value={p}>{p}</option>)}
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
        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center">
              <IconArrowLeft size={20} />
            </button>
          )}

          {/* DYNAMIC CONDITIONAL SKIP BUTTON */}
          {[1, 2, 3].includes(step) && (
            <button onClick={handleSkip} className="flex-1 py-4 bg-slate-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center">
              Skip
            </button>
          )}

          <button 
            onClick={step === totalSteps ? handleSubmit : nextStep}
            disabled={!canProgress()}
            className={`flex-[3] py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all 
              ${!canProgress() ? 'opacity-40 cursor-not-allowed grayscale' : 'active:scale-95'}`}
            style={{ backgroundColor: colors.blue }}
          >
            {step === totalSteps ? <><IconCheck size={20} /> Complete</> : <><IconArrowRight size={20} /> Next</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;