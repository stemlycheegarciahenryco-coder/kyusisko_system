import React, { useState, useEffect } from 'react';
import { CheckCircle2, School, User, Users, Loader2, Pencil, Check, AlertCircle } from 'lucide-react';
import api from '../api';

const QC_CITY_CODE = '137404000';

// Enabled = white, disabled (not in edit mode) = gray
const inputCls =
  "w-full px-3.5 py-2.5 bg-white border-2 border-black/20 rounded-xl focus:border-[#093fb4] outline-none transition-all placeholder:text-black/35 font-bold text-black text-sm " +
  "disabled:bg-gray-100 disabled:text-black/50 disabled:border-gray-200 disabled:placeholder:text-black/25 disabled:cursor-not-allowed";
const labelCls = "text-[11px] font-black text-black/70 uppercase ml-1 tracking-[0.12em] block mb-1.5";

// Normalises whatever is stored in the DB into the 10 digits after +63
const normalizePhone = (raw) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('63') && d.length > 10) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
};

function SectionTitle({ icon: Icon, title, description, isEditing, onToggleEdit }) {
  return (
    <div className="mb-4 pt-5 border-t-2 border-black/5 first:border-0 first:pt-0 flex justify-between items-start gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
            <Icon size={15} strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-black text-black uppercase tracking-wide">{title}</h3>
        </div>
        {description && <p className="text-[11px] font-bold text-black/50 ml-[38px]">{description}</p>}
      </div>

      <button
        type="button"
        onClick={onToggleEdit}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
          isEditing
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            : 'bg-white text-[#093fb4] border-[#093fb4]/20 hover:border-[#093fb4] shadow-sm'
        }`}
      >
        {isEditing ? <><Check size={13} strokeWidth={3} /> Done</> : <><Pencil size={13} strokeWidth={2.5} /> Edit</>}
      </button>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 min-w-0 ${className}`}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function ContactField({ label, value, onChange, disabled, error }) {
  return (
    <div className="space-y-1 min-w-0">
      <label className={labelCls}>{label}</label>
      <div
        className={`flex items-stretch border-2 rounded-xl transition-all overflow-hidden ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : error
              ? 'bg-white border-red-500'
              : 'bg-white border-black/20 focus-within:border-[#093fb4]'
        }`}
      >
        <div className={`px-3 font-black border-r-2 flex items-center justify-center text-sm shrink-0 ${
          disabled ? 'text-black/40 border-gray-200 bg-gray-100' : 'text-black/60 border-black/10 bg-black/5'
        }`}>
          +63
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          placeholder="9XXXXXXXXX"
          disabled={disabled}
          value={value}
          onChange={onChange}
          className="w-full min-w-0 px-3 py-2.5 bg-transparent outline-none font-bold text-black text-sm placeholder:text-black/30 disabled:text-black/50 disabled:cursor-not-allowed"
        />
      </div>
      {error && <p className="text-[10px] font-black text-red-600 uppercase tracking-wider ml-1 mt-1">{error}</p>}
    </div>
  );
}

export default function StudentEditProfile({ studentData, onClose, onRefresh }) {
  const [form, setForm] = useState({
    bio: studentData?.bio || '',
    college_id: '',
    course_id: '',
    other_school: studentData?.other_school || '',
    other_degree_program: studentData?.other_degree_program || '',
    sports_interests: Array.isArray(studentData?.sports_interests) ? studentData.sports_interests.join(', ') : studentData?.sports_interests || '',
    student_id: studentData?.student_id || '',
    year_level: studentData?.year_level || '',
    gwa: studentData?.gwa || '',
    scontact_number: normalizePhone(studentData?.scontact_number),
    sstreet: studentData?.sstreet || '',
    sdistrict: studentData?.sdistrict || '',
    sbarangay: studentData?.sbarangay || '',
    szip_code: studentData?.szip_code || '',
    sgender: studentData?.sgender || '',
    religion: studentData?.religion || '',
    other_religion: studentData?.other_religion || '',
    mother_name: studentData?.mother_name || '',
    mother_contact: normalizePhone(studentData?.mother_contact),
    mother_occupation: studentData?.mother_occupation || '',
    father_name: studentData?.father_name || '',
    father_contact: normalizePhone(studentData?.father_contact),
    father_occupation: studentData?.father_occupation || '',
    guardian_name: studentData?.guardian_name || '',
    guardian_contact: normalizePhone(studentData?.guardian_contact),
    guardian_occupation: studentData?.guardian_occupation || '',
    house_address: studentData?.house_address || ''
  });

  const [editMode, setEditMode] = useState({ academic: false, personal: false, family: false });
  const [hasEdited, setHasEdited] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  // Colleges / courses lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [collegeRes, courseRes] = await Promise.all([
          api.get('/lookup/colleges'),
          api.get('/lookup/courses')
        ]);
        setColleges(collegeRes.data);
        setCourses(courseRes.data);

        let matchedCollegeId = '';
        if (studentData?.other_school && studentData.other_school !== 'Currently not enrolled') {
          matchedCollegeId = 'Others';
        } else if (studentData?.college_name) {
          const found = collegeRes.data.find(c => c.name === studentData.college_name);
          if (found) matchedCollegeId = found.id;
        }

        let matchedCourseId = '';
        if (studentData?.other_degree_program && studentData.other_degree_program !== 'Currently not enrolled') {
          matchedCourseId = 'Others';
        } else if (studentData?.course_name) {
          const found = courseRes.data.find(c => c.name === studentData.course_name);
          if (found) matchedCourseId = found.id;
        }

        setForm(prev => ({ ...prev, college_id: matchedCollegeId, course_id: matchedCourseId }));
      } catch (err) { }
    };
    fetchLookups();
  }, [studentData]);

  // Quezon City barangays (PSGC API)
  useEffect(() => {
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${QC_CITY_CODE}/barangays/`)
      .then(res => res.json())
      .then(data => setBarangays([...data].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(err => console.error('Error fetching barangays:', err));
  }, []);

  // Which fields are checked when a section is closed with "Done"
  const validateSection = (section) => {
    const errors = {};
    const phoneError = 'Enter a valid 10-digit number starting with 9';

    if (section === 'personal') {
      if (form.scontact_number && form.scontact_number.length !== 10) errors.scontact_number = phoneError;
      if (form.szip_code && !/^\d{4}$/.test(form.szip_code)) errors.szip_code = 'Postal code must be exactly 4 digits';
    }
    if (section === 'family') {
      ['mother_contact', 'father_contact', 'guardian_contact'].forEach(key => {
        if (form[key] && form[key].length !== 10) errors[key] = phoneError;
      });
    }
    return errors;
  };

  const sectionFields = {
    academic: [],
    personal: ['scontact_number', 'szip_code'],
    family: ['mother_contact', 'father_contact', 'guardian_contact']
  };

  const handleToggleEdit = (section) => {
    if (editMode[section]) {
      // Clicking "Done": block if anything is invalid
      const errors = validateSection(section);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...errors }));
        return;
      }
      setFieldErrors(prev => {
        const next = { ...prev };
        sectionFields[section].forEach(k => delete next[k]);
        return next;
      });
      setEditMode(p => ({ ...p, [section]: false }));
    } else {
      setEditMode(p => ({ ...p, [section]: true }));
      setHasEdited(true);
    }
  };

  const clearError = (field) => setFieldErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev));

  const handleContactChange = (field, e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1);
    if (val.length > 0 && val[0] !== '9') val = '';
    setForm(prev => ({ ...prev, [field]: val.slice(0, 10) }));
    clearError(field);
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setGlobalError('');

    // Any section still open gets the same check as its "Done" button
    let errors = {};
    Object.keys(editMode).forEach(section => {
      if (editMode[section]) errors = { ...errors, ...validateSection(section) };
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    setSaving(true);
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
        sdistrict: form.sdistrict,
        sbarangay: form.sbarangay,
        szip_code: form.szip_code,
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
      setGlobalError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to save profile updates.');
    } finally {
      setSaving(false);
    }
  };

  const currentBarangayMissing = form.sbarangay && !barangays.some(b => b.name === form.sbarangay);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Inter']">
      {/* Always-visible scrollbar on the side of the form body */}
      <style>{`
        .edit-profile-scroll { scrollbar-width: thin; scrollbar-color: #093fb4 #e5e7eb; }
        .edit-profile-scroll::-webkit-scrollbar { width: 8px; }
        .edit-profile-scroll::-webkit-scrollbar-track { background: #e5e7eb; border-radius: 9999px; }
        .edit-profile-scroll::-webkit-scrollbar-thumb { background: #093fb4; border-radius: 9999px; }
      `}</style>

      <div className="bg-white w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border-4 border-black/5 shadow-2xl overflow-hidden">
        {showSuccess ? (
          <div className="p-8 text-center flex flex-col items-center max-w-xs mx-auto">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-inner border-2 border-emerald-100">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black text-black uppercase tracking-tight mb-2">Profile Updated!</h3>
            <p className="text-xs text-black/60 font-bold leading-relaxed mb-6">
              Your academic, personal, and family information has been saved.
            </p>
            <button
              onClick={() => { setShowSuccess(false); onClose(); }}
              className="w-full bg-[#093fb4] hover:bg-[#073496] text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#093fb4]/25 active:scale-95"
            >
              Close & View Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveAll} noValidate className="flex flex-col min-h-0 flex-1">
            {/* Header (no X button) */}
            <div className="px-6 pt-6 pb-4 border-b-2 border-black/5 shrink-0">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Edit Profile</h2>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.18em] mt-1">
                Update all your records in one place
              </p>
            </div>

            {/* Scrollable body */}
            <div className="edit-profile-scroll flex-1 min-h-0 overflow-y-scroll px-6 py-5 text-left">
              {globalError && (
                <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-200 text-red-600 text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center gap-2.5">
                  <AlertCircle size={18} strokeWidth={2.5} className="shrink-0" /> {globalError}
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
              <div className="space-y-4 mb-7">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Student ID">
                    <input
                      type="text"
                      disabled={!editMode.academic}
                      placeholder="2026-00123"
                      maxLength={20}
                      className={inputCls}
                      value={form.student_id}
                      onChange={e => setForm(prev => ({ ...prev, student_id: e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20) }))}
                    />
                  </Field>
                  <Field label="Academic Level">
                    <select
                      disabled={!editMode.academic}
                      className={inputCls}
                      value={form.year_level}
                      onChange={e => setForm(prev => ({ ...prev, year_level: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="PostGraduate">PostGraduate</option>
                      <option value="Masters">Masters</option>
                      <option value="Doctorate">Doctorate</option>
                    </select>
                  </Field>
                  <Field label="GWA (%)">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!editMode.academic}
                        placeholder="e.g. 85"
                        className={`${inputCls} pr-8`}
                        value={form.gwa}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val === '') {
                            setForm(prev => ({ ...prev, gwa: '' }));
                            return;
                          }
                          setForm(prev => ({ ...prev, gwa: Math.min(parseInt(val, 10), 100) }));
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-black/40 text-sm pointer-events-none">%</span>
                    </div>
                  </Field>
                </div>

                <Field label="Current College / University">
                  <select
                    disabled={!editMode.academic}
                    className={inputCls}
                    value={form.college_id}
                    onChange={e => setForm(prev => ({ ...prev, college_id: e.target.value, other_school: e.target.value === 'Others' ? prev.other_school : '' }))}
                  >
                    <option value="">Select your school</option>
                    {colleges.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.college_id === 'Others' && (
                    <input
                      type="text"
                      disabled={!editMode.academic}
                      placeholder="Enter school name..."
                      className={`${inputCls} mt-2`}
                      value={form.other_school}
                      onChange={e => setForm(prev => ({ ...prev, other_school: e.target.value }))}
                    />
                  )}
                </Field>

                <Field label="Degree Program / Course">
                  <select
                    disabled={!editMode.academic}
                    className={inputCls}
                    value={form.course_id}
                    onChange={e => setForm(prev => ({ ...prev, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? prev.other_degree_program : '' }))}
                  >
                    <option value="">Select your course</option>
                    {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.course_id === 'Others' && (
                    <input
                      type="text"
                      disabled={!editMode.academic}
                      placeholder="Enter course name..."
                      className={`${inputCls} mt-2`}
                      value={form.other_degree_program}
                      onChange={e => setForm(prev => ({ ...prev, other_degree_program: e.target.value }))}
                    />
                  )}
                </Field>

                <Field label="About Yourself (Bio)">
                  <textarea
                    disabled={!editMode.academic}
                    placeholder="Write a short summary..."
                    className={`${inputCls} resize-none min-h-[84px]`}
                    value={form.bio}
                    onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </Field>
              </div>

              {/* ================= 2. PERSONAL ================= */}
              <SectionTitle
                icon={User}
                title="Personal Details"
                description="Contact, address, and demographic data"
                isEditing={editMode.personal}
                onToggleEdit={() => handleToggleEdit('personal')}
              />
              <div className="space-y-4 mb-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ContactField
                    label="Contact Number"
                    value={form.scontact_number}
                    onChange={e => handleContactChange('scontact_number', e)}
                    disabled={!editMode.personal}
                    error={fieldErrors.scontact_number}
                  />
                  <Field label="Gender">
                    <select
                      disabled={!editMode.personal}
                      className={inputCls}
                      value={form.sgender}
                      onChange={e => setForm(prev => ({ ...prev, sgender: e.target.value }))}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </Field>

                  <Field label="Religion">
                    <select
                      disabled={!editMode.personal}
                      className={inputCls}
                      value={form.religion}
                      onChange={e => setForm(prev => ({ ...prev, religion: e.target.value, other_religion: e.target.value === 'Others' ? prev.other_religion : '' }))}
                    >
                      <option value="">Select Religion</option>
                      <option value="Roman Catholic">Roman Catholic</option>
                      <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                      <option value="Islam">Islam</option>
                      <option value="Others">Others</option>
                    </select>
                  </Field>
                  {form.religion === 'Others' && (
                    <Field label="Specify Religion">
                      <input
                        type="text"
                        disabled={!editMode.personal}
                        placeholder="Enter religion..."
                        className={inputCls}
                        value={form.other_religion}
                        onChange={e => setForm(prev => ({ ...prev, other_religion: e.target.value }))}
                      />
                    </Field>
                  )}
                </div>

                <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.18em] pt-1">
                  Permanent Address (Quezon City)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="District">
                    <select
                      disabled={!editMode.personal}
                      className={inputCls}
                      value={form.sdistrict}
                      onChange={e => setForm(prev => ({ ...prev, sdistrict: e.target.value }))}
                    >
                      <option value="">Select District</option>
                      {[1, 2, 3, 4, 5, 6].map(d => (
                        <option key={d} value={`District ${d}`}>District {d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Barangay">
                    <select
                      disabled={!editMode.personal || !form.sdistrict}
                      className={inputCls}
                      value={form.sbarangay}
                      onChange={e => setForm(prev => ({ ...prev, sbarangay: e.target.value }))}
                    >
                      <option value="">Select Barangay</option>
                      {currentBarangayMissing && <option value={form.sbarangay}>{form.sbarangay}</option>}
                      {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                    </select>
                  </Field>
                  <Field label="House No. & Street">
                    <input
                      type="text"
                      disabled={!editMode.personal}
                      placeholder="House No., Street name"
                      className={inputCls}
                      value={form.sstreet}
                      onChange={e => setForm(prev => ({ ...prev, sstreet: e.target.value }))}
                    />
                  </Field>
                  <Field label="Postal Code">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      disabled={!editMode.personal}
                      placeholder="1100"
                      className={`${inputCls} ${fieldErrors.szip_code ? '!border-red-500' : ''}`}
                      value={form.szip_code}
                      onChange={e => {
                        setForm(prev => ({ ...prev, szip_code: e.target.value.replace(/\D/g, '').slice(0, 4) }));
                        clearError('szip_code');
                      }}
                    />
                    {fieldErrors.szip_code && (
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-wider ml-1 mt-1">{fieldErrors.szip_code}</p>
                    )}
                  </Field>
                </div>
              </div>

              {/* ================= 3. FAMILY ================= */}
              <SectionTitle
                icon={Users}
                title="Family Information"
                description="Parents and guardian details"
                isEditing={editMode.family}
                onToggleEdit={() => handleToggleEdit('family')}
              />
              <div className="space-y-5 mb-2">
                {[
                  { key: 'mother', title: "Mother's Details", occLabel: 'Occupation' },
                  { key: 'father', title: "Father's Details", occLabel: 'Occupation' },
                  { key: 'guardian', title: 'Guardian Details', occLabel: 'Relationship / Occupation' }
                ].map(({ key, title, occLabel }) => (
                  <div key={key}>
                    <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.18em] mb-2.5">{title}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        disabled={!editMode.family}
                        placeholder="Full Name"
                        className={`${inputCls} sm:col-span-2`}
                        value={form[`${key}_name`]}
                        onChange={e => setForm(prev => ({ ...prev, [`${key}_name`]: e.target.value }))}
                      />
                      <ContactField
                        label="Contact Number"
                        value={form[`${key}_contact`]}
                        onChange={e => handleContactChange(`${key}_contact`, e)}
                        disabled={!editMode.family}
                        error={fieldErrors[`${key}_contact`]}
                      />
                      <Field label={occLabel}>
                        <input
                          type="text"
                          disabled={!editMode.family}
                          placeholder={occLabel}
                          className={inputCls}
                          value={form[`${key}_occupation`]}
                          onChange={e => setForm(prev => ({ ...prev, [`${key}_occupation`]: e.target.value }))}
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                <Field label="Family Household Address">
                  <textarea
                    disabled={!editMode.family}
                    placeholder="Enter complete family residential home address..."
                    className={`${inputCls} resize-none min-h-[84px]`}
                    value={form.house_address}
                    onChange={e => setForm(prev => ({ ...prev, house_address: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            {/* Footer: Cancel / Update */}
            <div className="px-6 py-4 border-t-2 border-black/5 bg-white shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] border-2 border-black/15 text-black/70 hover:bg-black/5 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !hasEdited}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 border-2 ${
                    hasEdited
                      ? 'bg-[#093fb4] hover:bg-[#073496] text-white border-transparent shadow-lg shadow-[#093fb4]/25 active:scale-95'
                      : 'bg-black/10 text-black/40 cursor-not-allowed border-transparent'
                  }`}
                >
                  {saving ? <><Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> Updating...</> : 'Update'}
                </button>
              </div>
              {!hasEdited && (
                <p className="text-center text-[10px] font-black text-black/40 uppercase tracking-widest mt-3">
                  Click 'Edit' on a section to make changes
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}