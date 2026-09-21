import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, School, User, Users, ChevronRight, Loader2, Pencil, Check } from 'lucide-react';
import api from '../api';

const inputCls = "w-full px-5 py-4 bg-black/10 border-2 border-black/15 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/45 font-bold text-black text-sm shadow-sm disabled:opacity-60 disabled:bg-black/5 disabled:border-transparent disabled:cursor-not-allowed";
const labelCls = "text-xs font-black text-black/70 uppercase ml-1 tracking-[0.15em] block mb-2";

// 1. Dynamic Section Title with Edit Toggle
function SectionTitle({ icon: Icon, title, description, isEditing, onToggleEdit }) {
  return (
    <div className="mb-6 pt-6 border-t-2 border-black/5 first:border-0 first:pt-0 flex justify-between items-start">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center">
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-black text-black uppercase tracking-wider">{title}</h3>
        </div>
        {description && <p className="text-xs font-bold text-black/50 ml-11">{description}</p>}
      </div>
      
      <button
        type="button"
        onClick={onToggleEdit}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 mt-1 ${
          isEditing
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            : 'bg-white text-[#093fb4] border-[#093fb4]/20 hover:border-[#093fb4] shadow-sm'
        }`}
      >
        {isEditing ? <><Check size={14} strokeWidth={3}/> Done</> : <><Pencil size={14} strokeWidth={2.5}/> Edit</>}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// 2. Custom Phone Field with built-in +63 Prefix and Inline Error/Helper Text
function ContactField({ label, value, onChange, disabled, error }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      <div className={`flex items-stretch bg-black/10 border-2 rounded-2xl transition-all overflow-hidden ${
        disabled 
          ? 'opacity-60 cursor-not-allowed border-transparent bg-black/5' 
          : error 
            ? 'bg-white border-red-500 shadow-sm'
            : 'focus-within:bg-white focus-within:border-[#093fb4] border-black/15 shadow-sm'
      }`}>
        <div className="px-4 font-black text-black/50 border-r-2 border-black/10 bg-black/5 flex items-center justify-center text-sm shrink-0">
          +63
        </div>
        <input
          type="text"
          maxLength={10}
          placeholder="9XXXXXXXXX"
          disabled={disabled}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-4 bg-transparent outline-none font-bold text-black text-sm placeholder:text-black/30 disabled:cursor-not-allowed"
        />
      </div>
      {/* Permanent Helper Text that turns into an Error Warning */}
      {error ? (
        <p className="text-[10px] font-black text-red-600 uppercase tracking-wider ml-2 mt-1.5">{error}</p>
      ) : (
        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest ml-2 mt-1.5">Format: 9XXXXXXXXX (10 Digits)</p>
      )}
    </div>
  );
}

export default function StudentEditProfile({ studentData, onClose, onRefresh }) {
  const [form, setForm] = useState({
    bio: studentData?.bio || '',
    college_id: studentData?.college_id || '',
    course_id: studentData?.course_id || '',
    other_school: studentData?.other_school || '',
    other_degree_program: studentData?.other_degree_program || '',
    sports_interests: Array.isArray(studentData?.sports_interests) ? studentData.sports_interests.join(', ') : studentData?.sports_interests || '',
    student_id: studentData?.student_id || '', 
    year_level: studentData?.year_level || '', 
    gwa: studentData?.gwa || '',
    scontact_number: studentData?.scontact_number || '',
    sstreet: studentData?.sstreet || '',
    sbarangay: studentData?.sbarangay || '',
    sgender: studentData?.sgender || '',
    religion: studentData?.religion || '',
    other_religion: studentData?.other_religion || '',
    mother_name: studentData?.mother_name || '',
    mother_contact: studentData?.mother_contact || '',
    mother_occupation: studentData?.mother_occupation || '',
    father_name: studentData?.father_name || '',
    father_contact: studentData?.father_contact || '',
    father_occupation: studentData?.father_occupation || '',
    guardian_name: studentData?.guardian_name || '',
    guardian_contact: studentData?.guardian_contact || '',
    guardian_occupation: studentData?.guardian_occupation || '',
    house_address: studentData?.house_address || ''
  });

  const [editMode, setEditMode] = useState({
    academic: false,
    personal: false,
    family: false
  });

  // NEW: Tracks if the user has interacted with any edit button at all
  const [hasEdited, setHasEdited] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [contactErrors, setContactErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [collegeRes, courseRes] = await Promise.all([
          api.get('/lookup/colleges'),
          api.get('/lookup/courses')
        ]);
        setColleges(collegeRes.data);
        setCourses(courseRes.data);
      } catch (err) { }
    };
    fetchLookups();
  }, []);

  const handleToggleEdit = (section) => {
    setEditMode(p => ({ ...p, [section]: !p[section] }));
    setHasEdited(true); // Permanently unlocks the Save button once they try to edit
  };

  const handleContactChange = (field, e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1); 
    if (val.length > 0 && val[0] !== '9') val = ''; 
    
    setForm(prev => ({ ...prev, [field]: val.slice(0, 10) }));
    setContactErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setGlobalError('');
    setContactErrors({});

    let hasError = false;
    const newErrors = {};
    const phoneFields = ['scontact_number', 'mother_contact', 'father_contact', 'guardian_contact'];
    
    for (const key of phoneFields) {
      const val = form[key];
      // Only validate if they typed something (optional caregiver fields) OR if it's the main student number
      if (val && val.length !== 10) {
        newErrors[key] = "Must be a valid 10-digit number starting with 9";
        hasError = true;
      }
    }

    if (hasError) {
      setContactErrors(newErrors);
      setGlobalError("Please fix the invalid phone numbers highlighted below.");
      setSaving(false); 
      return;
    }

    try {
      const formData = new FormData();
      formData.append('bio', form.bio);
      formData.append('college_id', form.college_id);
      formData.append('course_id', form.course_id);
      formData.append('other_school', form.other_school);
      formData.append('other_degree_program', form.other_degree_program);
      formData.append('sports_interests', form.sports_interests);
      formData.append('academic_student_id', form.student_id); 
      formData.append('year_level', form.year_level);
      formData.append('gwa', form.gwa);
      await api.patch('/students/update-portfolio', formData);

      await api.put(`/students/personal-info/me`, {
        scontact_number: form.scontact_number,
        sstreet: form.sstreet,
        sbarangay: form.sbarangay,
        sgender: form.sgender,
        religion: form.religion,
        other_religion: form.other_religion
      });

      const hasCaregiverInfo = [form.mother_name, form.father_name, form.guardian_name].some(val => val && val.trim() !== '');
      if (hasCaregiverInfo) {
        await api.put(`/students/parent-profile/me`, {
          mother_name: form.mother_name,
          mother_contact: form.mother_contact,
          mother_occupation: form.mother_occupation,
          father_name: form.father_name,
          father_contact: form.father_contact,
          father_occupation: form.father_occupation,
          guardian_name: form.guardian_name,
          guardian_contact: form.guardian_contact,
          guardian_occupation: form.guardian_occupation,
          house_address: form.house_address
        });
      }

      const selectedCollege = colleges.find(c => String(c.id) === String(form.college_id));
      const selectedCourse = courses.find(c => String(c.id) === String(form.course_id));

      const optimisticPatch = { ...form, college_name: selectedCollege?.name || '', course_name: selectedCourse?.name || '' };

      if (onRefresh) await onRefresh(optimisticPatch);
      setShowSuccess(true);
    } catch (err) {
      console.error('Profile save failed:', err);
      setGlobalError(err?.response?.data?.message || err?.response?.data?.error || "Failed to save profile updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto font-['Inter']">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border-4 border-black/5 shadow-2xl overflow-hidden my-auto transition-all">

        {showSuccess ? (
          <div className="p-8 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 max-w-xs mx-auto">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-inner border-2 border-emerald-100">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-black uppercase tracking-tight mb-2">Profile Updated!</h3>
            <p className="text-xs text-black/60 font-bold leading-relaxed mb-6">
              Your academic, personal, and family information has been saved.
            </p>
            <button onClick={() => { setShowSuccess(false); onClose(); }} className="w-full bg-[#093fb4] hover:bg-[#073496] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#093fb4]/25 active:scale-95">
              Close & View Profile
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-8 pt-10 pb-6 border-b-2 border-black/5">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">Edit Profile</h2>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-2">
                  Update all your records in one place
                </p>
              </div>
              <button type="button" onClick={onClose} className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/40 hover:text-red-600 hover:bg-red-50 transition-all border-2 border-transparent">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSaveAll} noValidate className="p-8 md:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar text-left relative">
              
              {globalError && (
                <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-3">
                  <X size={20} strokeWidth={2.5}/> {globalError}
                </div>
              )}

              {/* ================= 1. ACADEMIC ================= */}
              <SectionTitle 
                icon={School} 
                title="Academic Information" 
                description="School, course, and grades" 
                isEditing={editMode.academic}
                onToggleEdit={() => handleToggleEdit('academic')}
              />
              <div className="space-y-6 mb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Student ID">
                    <input type="text" disabled={!editMode.academic} placeholder="e.g. 2026-00123-MN-0" maxLength={20} className={inputCls} value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20) })} />
                  </Field>
                  <Field label="Academic Level">
                    <select disabled={!editMode.academic} className={inputCls} value={form.year_level} onChange={e => setForm({ ...form, year_level: e.target.value })}>
                      <option value="">Select Level</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="PostGraduate">PostGraduate</option>
                      <option value="Masters">Masters</option>
                      <option value="Doctorate">Doctorate</option>
                    </select>
                  </Field>
                </div>
                
                {/* STRICT GWA PERCENTAGE LOGIC */}
                <Field label="GWA (Percentage)">
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      disabled={!editMode.academic}
                      placeholder="e.g. 85" 
                      className={inputCls} 
                      value={form.gwa} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, ''); // Strip decimals or weird chars
                        if (val === '') {
                          setForm({ ...form, gwa: '' });
                          return;
                        }
                        let num = parseInt(val, 10);
                        if (num > 100) num = 100; // Hard cap at 100
                        setForm({ ...form, gwa: num });
                      }} 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-black/40 text-lg">%</span>
                  </div>
                </Field>

                <Field label="Current College / University">
                  <select disabled={!editMode.academic} className={inputCls} value={form.college_id} onChange={e => setForm({ ...form, college_id: e.target.value, other_school: e.target.value === 'Others' ? form.other_school : '' })}>
                    <option value="">Select your school</option>
                    {colleges.map((col) => <option key={col.id} value={col.id}>{col.name}</option>)}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.college_id === 'Others' && (
                    <input type="text" disabled={!editMode.academic} placeholder="Enter school name..." className={`${inputCls} mt-3`} value={form.other_school} onChange={e => setForm({ ...form, other_school: e.target.value })} />
                  )}
                </Field>

                <Field label="Degree Program / Course">
                  <select disabled={!editMode.academic} className={inputCls} value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? form.other_degree_program : '' })}>
                    <option value="">Select your course</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.course_id === 'Others' && (
                    <input type="text" disabled={!editMode.academic} placeholder="Enter course name..." className={`${inputCls} mt-3`} value={form.other_degree_program} onChange={e => setForm({ ...form, other_degree_program: e.target.value })} />
                  )}
                </Field>

                <Field label="About Yourself (Bio)">
                  <textarea disabled={!editMode.academic} placeholder="Write a short summary..." className={`${inputCls} resize-none min-h-[100px]`} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </Field>
              </div>

              {/* ================= 2. PERSONAL ================= */}
              <SectionTitle 
                icon={User} 
                title="Personal Details" 
                description="Contact and demographic data" 
                isEditing={editMode.personal}
                onToggleEdit={() => handleToggleEdit('personal')}
              />
              <div className="space-y-6 mb-10">
                
                <ContactField 
                  label="Contact Number" 
                  value={form.scontact_number} 
                  onChange={e => handleContactChange('scontact_number', e)} 
                  disabled={!editMode.personal}
                  error={contactErrors.scontact_number}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="House No. & Street">
                    <input type="text" disabled={!editMode.personal} placeholder="Street Address" className={inputCls} value={form.sstreet} onChange={e => setForm({ ...form, sstreet: e.target.value })} />
                  </Field>
                  <Field label="Barangay">
                    <input type="text" disabled={!editMode.personal} placeholder="Barangay" className={inputCls} value={form.sbarangay} onChange={e => setForm({ ...form, sbarangay: e.target.value })} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Gender">
                    <select disabled={!editMode.personal} className={inputCls} value={form.sgender} onChange={e => setForm({ ...form, sgender: e.target.value })}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Religion">
                    <select disabled={!editMode.personal} className={inputCls} value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value, other_religion: e.target.value === 'Others' ? form.other_religion : '' })}>
                      <option value="">Select Religion</option>
                      <option value="Roman Catholic">Roman Catholic</option>
                      <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                      <option value="Islam">Islam</option>
                      <option value="Others">Others</option>
                    </select>
                  </Field>
                </div>

                {form.religion === 'Others' && (
                  <Field label="Specify Religion">
                    <input type="text" disabled={!editMode.personal} placeholder="Enter religion..." className={inputCls} value={form.other_religion} onChange={e => setForm({ ...form, other_religion: e.target.value })} />
                  </Field>
                )}
              </div>

              {/* ================= 3. FAMILY ================= */}
              <SectionTitle 
                icon={Users} 
                title="Family Information" 
                description="Parents and guardian details" 
                isEditing={editMode.family}
                onToggleEdit={() => handleToggleEdit('family')}
              />
              <div className="space-y-8 mb-8">
                <div>
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Mother's Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input type="text" disabled={!editMode.family} placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} />
                    <ContactField label="Contact Number" value={form.mother_contact} onChange={e => handleContactChange('mother_contact', e)} disabled={!editMode.family} error={contactErrors.mother_contact} />
                    <div className="space-y-1"><label className={labelCls}>Occupation</label><input type="text" disabled={!editMode.family} placeholder="Occupation" className={inputCls} value={form.mother_occupation} onChange={e => setForm({ ...form, mother_occupation: e.target.value })} /></div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Father's Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input type="text" disabled={!editMode.family} placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} />
                    <ContactField label="Contact Number" value={form.father_contact} onChange={e => handleContactChange('father_contact', e)} disabled={!editMode.family} error={contactErrors.father_contact} />
                    <div className="space-y-1"><label className={labelCls}>Occupation</label><input type="text" disabled={!editMode.family} placeholder="Occupation" className={inputCls} value={form.father_occupation} onChange={e => setForm({ ...form, father_occupation: e.target.value })} /></div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Guardian Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input type="text" disabled={!editMode.family} placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
                    <ContactField label="Contact Number" value={form.guardian_contact} onChange={e => handleContactChange('guardian_contact', e)} disabled={!editMode.family} error={contactErrors.guardian_contact} />
                    <div className="space-y-1"><label className={labelCls}>Relationship / Occupation</label><input type="text" disabled={!editMode.family} placeholder="Relationship / Occupation" className={inputCls} value={form.guardian_occupation} onChange={e => setForm({ ...form, guardian_occupation: e.target.value })} /></div>
                  </div>
                </div>

                <Field label="Family Household Address">
                  <textarea disabled={!editMode.family} placeholder="Enter complete family residential home address..." className={`${inputCls} resize-none min-h-[100px]`} value={form.house_address} onChange={e => setForm({ ...form, house_address: e.target.value })} />
                </Field>
              </div>

              {/* MASTER SUBMIT BUTTON */}
              <div className="pt-8 mt-8 border-t-2 border-black/5 pb-2">
                <button
                  type="submit" 
                  disabled={saving || !hasEdited}
                  className={`w-full font-black py-4 rounded-2xl transition-all uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 ${
                    hasEdited 
                      ? 'bg-[#093fb4] hover:bg-[#073496] text-white shadow-xl shadow-[#093fb4]/25 active:scale-95'
                      : 'bg-black/10 text-black/40 cursor-not-allowed border-2 border-transparent'
                  }`}
                >
                  {saving ? (
                    <><Loader2 size={20} className="animate-spin" strokeWidth={2.5}/> Saving Profile...</>
                  ) : (
                    <>Save All Profile Updates <ChevronRight size={20} strokeWidth={2.5}/></>
                  )}
                </button>
                
                {!hasEdited && (
                  <p className="text-center text-[10px] font-black text-black/40 uppercase tracking-widest mt-4">
                    Click 'Edit' on a section above to make changes
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}