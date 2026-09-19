import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, School, User, Users, ChevronRight, Loader2 } from 'lucide-react';
import api from '../api';

// Stronger contrast: visible border + darker placeholder so fields read clearly
const inputCls = "w-full px-5 py-4 bg-black/10 border-2 border-black/15 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/45 font-bold text-black text-sm shadow-sm";
const labelCls = "text-xs font-black text-black/70 uppercase ml-1 tracking-[0.15em] block mb-2";

function sanitizeContact(rawValue, currentValue) {
  let cleaned = rawValue.replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned[0] !== '9') return currentValue;
  if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
  return cleaned;
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 pt-6 border-t-2 border-black/5 first:border-0 first:pt-0">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-black text-black uppercase tracking-wider">{title}</h3>
      </div>
      {description && <p className="text-xs font-bold text-black/50 ml-11">{description}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default function StudentEditProfile({ studentData, onClose, onRefresh }) {
  const [form, setForm] = useState({
    // ACADEMIC
    bio: studentData?.bio || '',
    college_id: studentData?.college_id || '',
    course_id: studentData?.course_id || '',
    other_school: studentData?.other_school || '',
    other_degree_program: studentData?.other_degree_program || '',
    sports_interests: Array.isArray(studentData?.sports_interests) ? studentData.sports_interests.join(', ') : studentData?.sports_interests || '',
    student_id: studentData?.student_id || '', 
    year_level: studentData?.year_level || '', 
    gwa: studentData?.gwa || '',
    // PERSONAL
    scontact_number: studentData?.scontact_number || '',
    sstreet: studentData?.sstreet || '',
    sbarangay: studentData?.sbarangay || '',
    sgender: studentData?.sgender || '',
    religion: studentData?.religion || '',
    other_religion: studentData?.other_religion || '',
    // FAMILY
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

  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleContactChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: sanitizeContact(value, prev[field]) }));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    // Phone Validation Check
    const phoneFields = ['scontact_number', 'mother_contact', 'father_contact', 'guardian_contact'];
    for (const key of phoneFields) {
      const val = form[key];
      if (val && val.length !== 11) {
        setErrorMsg("All provided contact numbers must be exactly 10 digits long and start with 9 (e.g. 9123456789).");
        setSaving(false); return;
      }
    }

    try {
      // 1. Save Academic (FormData)
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

      // 2. Save Personal
      await api.put(`/students/personal-info/me`, {
        scontact_number: form.scontact_number,
        sstreet: form.sstreet,
        sbarangay: form.sbarangay,
        sgender: form.sgender,
        religion: form.religion,
        other_religion: form.other_religion
      });

      // 3. Save Family — only if at least one caregiver is actually filled in.
      // The backend enforces an "at least one caregiver" rule at the database
      // level and rejects an all-blank submission, even though the Family
      // section is optional in this UI. Skipping the call here avoids that
      // conflict instead of surfacing it as a broken "Save All".
      const hasCaregiverInfo = [
        form.mother_name, form.father_name, form.guardian_name
      ].some(val => val && val.trim() !== '');

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

      // Build an optimistic patch so the profile page can reflect the
      // change instantly, without waiting on (or depending on) a refetch.
      const selectedCollege = colleges.find(c => String(c.id) === String(form.college_id));
      const selectedCourse = courses.find(c => String(c.id) === String(form.course_id));

      const optimisticPatch = {
        bio: form.bio,
        college_id: form.college_id,
        course_id: form.course_id,
        college_name: form.college_id === 'Others' ? '' : (selectedCollege?.name || ''),
        course_name: form.course_id === 'Others' ? '' : (selectedCourse?.name || ''),
        other_school: form.other_school,
        other_degree_program: form.other_degree_program,
        sports_interests: form.sports_interests,
        student_id: form.student_id,
        year_level: form.year_level,
        gwa: form.gwa,
        scontact_number: form.scontact_number,
        sstreet: form.sstreet,
        sbarangay: form.sbarangay,
        sgender: form.sgender,
        religion: form.religion,
        other_religion: form.other_religion,
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
      };

      if (onRefresh) await onRefresh(optimisticPatch);
      setShowSuccess(true);
    } catch (err) {
      console.error('Profile save failed:', err?.response?.status, err?.response?.data || err?.message);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      setErrorMsg(serverMsg || "Failed to save profile updates. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto font-['Inter']">
      {/* FIXED: Solid bg-white, max-w-2xl (narrower) */}
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
            <button
              onClick={handleDone}
              className="w-full bg-[#093fb4] hover:bg-[#073496] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#093fb4]/25 active:scale-95"
            >
              Close & View Profile
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center px-8 pt-10 pb-6 border-b-2 border-black/5">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">Edit Profile</h2>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-2">
                  Update all your records in one place
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/40 hover:text-red-600 hover:bg-red-50 transition-all border-2 border-transparent"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Unified Form */}
            <form onSubmit={handleSaveAll} noValidate className="p-8 md:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar text-left">
              
              {errorMsg && (
                <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-3">
                  <X size={20} strokeWidth={2.5}/> {errorMsg}
                </div>
              )}

              {/* 1. ACADEMIC */}
              <SectionTitle icon={School} title="Academic Information" description="School, course, and grades" />
              <div className="space-y-6 mb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Student ID">
                    <input type="text" placeholder="e.g. 2026-00123-MN-0" maxLength={20} className={inputCls} value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20) })} />
                  </Field>
                  <Field label="Academic Level">
                    <select className={inputCls} value={form.year_level} onChange={e => setForm({ ...form, year_level: e.target.value })}>
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
                
                <Field label="GWA (Grade)">
                  <input type="number" step="0.01" min="1.00" max="5.00" placeholder="e.g. 1.50" className={inputCls} value={form.gwa} onChange={e => setForm({ ...form, gwa: e.target.value })} />
                </Field>

                <Field label="Current College / University">
                  <select className={inputCls} value={form.college_id} onChange={e => setForm({ ...form, college_id: e.target.value, other_school: e.target.value === 'Others' ? form.other_school : '' })}>
                    <option value="">Select your school</option>
                    {colleges.map((col) => <option key={col.id} value={col.id}>{col.name}</option>)}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.college_id === 'Others' && (
                    <input type="text" placeholder="Enter school name..." className={`${inputCls} mt-3`} value={form.other_school} onChange={e => setForm({ ...form, other_school: e.target.value })} />
                  )}
                </Field>

                <Field label="Degree Program / Course">
                  <select className={inputCls} value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? form.other_degree_program : '' })}>
                    <option value="">Select your course</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.course_id === 'Others' && (
                    <input type="text" placeholder="Enter course name..." className={`${inputCls} mt-3`} value={form.other_degree_program} onChange={e => setForm({ ...form, other_degree_program: e.target.value })} />
                  )}
                </Field>

                <Field label="About Yourself (Bio)">
                  <textarea placeholder="Write a short summary..." className={`${inputCls} resize-none min-h-[100px]`} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </Field>
              </div>

              {/* 2. PERSONAL */}
              <SectionTitle icon={User} title="Personal Details" description="Contact and demographic data" />
              <div className="space-y-6 mb-10">
                <Field label="Contact Number">
                  <input type="text" maxLength={10} placeholder="e.g. 9123456789" className={inputCls} value={form.scontact_number} onChange={e => handleContactChange('scontact_number', e.target.value)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="House No. & Street">
                    <input type="text" placeholder="Street Address" className={inputCls} value={form.sstreet} onChange={e => setForm({ ...form, sstreet: e.target.value })} />
                  </Field>
                  <Field label="Barangay">
                    <input type="text" placeholder="Barangay" className={inputCls} value={form.sbarangay} onChange={e => setForm({ ...form, sbarangay: e.target.value })} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Gender">
                    <select className={inputCls} value={form.sgender} onChange={e => setForm({ ...form, sgender: e.target.value })}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Religion">
                    <select className={inputCls} value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value, other_religion: e.target.value === 'Others' ? form.other_religion : '' })}>
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
                    <input type="text" placeholder="Enter religion..." className={inputCls} value={form.other_religion} onChange={e => setForm({ ...form, other_religion: e.target.value })} />
                  </Field>
                )}
              </div>

              {/* 3. FAMILY */}
              <SectionTitle icon={Users} title="Family Information" description="Parents and guardian details" />
              <div className="space-y-8 mb-8">
                <div>
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Mother's Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input type="text" placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} />
                    <input type="text" maxLength={10} placeholder="Contact Number" className={inputCls} value={form.mother_contact} onChange={e => handleContactChange('mother_contact', e.target.value)} />
                    <input type="text" placeholder="Occupation" className={inputCls} value={form.mother_occupation} onChange={e => setForm({ ...form, mother_occupation: e.target.value })} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Father's Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input type="text" placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} />
                    <input type="text" maxLength={10} placeholder="Contact Number" className={inputCls} value={form.father_contact} onChange={e => handleContactChange('father_contact', e.target.value)} />
                    <input type="text" placeholder="Occupation" className={inputCls} value={form.father_occupation} onChange={e => setForm({ ...form, father_occupation: e.target.value })} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Guardian Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input type="text" placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
                    <input type="text" maxLength={10} placeholder="Contact Number" className={inputCls} value={form.guardian_contact} onChange={e => handleContactChange('guardian_contact', e.target.value)} />
                    <input type="text" placeholder="Relationship / Occupation" className={inputCls} value={form.guardian_occupation} onChange={e => setForm({ ...form, guardian_occupation: e.target.value })} />
                  </div>
                </div>

                <Field label="Family Household Address">
                  <textarea placeholder="Enter complete family residential home address..." className={`${inputCls} resize-none min-h-[100px]`} value={form.house_address} onChange={e => setForm({ ...form, house_address: e.target.value })} />
                </Field>
              </div>

              {/* FIXED: Removed the sticky behavior. The button now sits naturally at the bottom. */}
              <div className="pt-8 mt-8 border-t-2 border-black/5 pb-2">
                <button
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-95 uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3"
                >
                  {saving ? (
                    <><Loader2 size={20} className="animate-spin" strokeWidth={2.5}/> Saving Profile...</>
                  ) : (
                    <>Save All Profile Updates <ChevronRight size={20} strokeWidth={2.5}/></>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}