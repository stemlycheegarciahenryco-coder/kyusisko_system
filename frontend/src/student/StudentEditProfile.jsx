import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, School, User, Users, ChevronRight } from 'lucide-react';
import api from '../api';

const inputCls = "w-full px-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-sm shadow-sm";
const labelCls = "text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block mb-2";

function sanitizeContact(rawValue, currentValue) {
  let cleaned = rawValue.replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned[0] !== '9') return currentValue;
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
  return cleaned;
}

const TABS = [
  { key: 'academic', label: 'Academic', icon: School },
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'family', label: 'Family', icon: Users },
];

export default function StudentEditProfile({ initialTab = 'academic', studentData, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto font-['Inter']">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-3xl rounded-[2.5rem] border border-white/60 shadow-2xl overflow-hidden my-auto transition-all">

        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-10 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Edit Profile</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
              Keep your records up to date
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/60 border-2 border-white/80 flex items-center justify-center text-slate-500 hover:text-[#FF1E1E] transition-all shadow-sm"
          >
            <X size={24} stroke={2.5} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-8 border-b border-black/5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-[0.1em] border-b-4 transition-all ${
                  isActive
                    ? 'border-[#093fb4] text-[#093fb4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={18} stroke={2.5} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-8 md:p-10 max-h-[65vh] overflow-y-auto scrollbar-thin text-left">
          <div className={activeTab === 'academic' ? 'block' : 'hidden'}>
            <AcademicSection studentData={studentData} onRefresh={onRefresh} />
          </div>
          <div className={activeTab === 'personal' ? 'block' : 'hidden'}>
            <PersonalSection studentData={studentData} onRefresh={onRefresh} />
          </div>
          <div className={activeTab === 'family' ? 'block' : 'hidden'}>
            <FamilySection studentData={studentData} onRefresh={onRefresh} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessBanner({ message }) {
  return (
    <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-3">
      <CheckCircle2 size={20} className="shrink-0 text-emerald-500" stroke={2.5} /> {message}
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

// ─────────────────────────────────────────────────────────
// 1. ACADEMIC SECTION
// ─────────────────────────────────────────────────────────
function AcademicSection({ studentData, onRefresh }) {
  const [form, setForm] = useState({
    bio: studentData?.bio || '',
    college_id: studentData?.college_id || '',
    course_id: studentData?.course_id || '',
    other_school: studentData?.other_school || '',
    other_degree_program: studentData?.other_degree_program || '',
    sports_interests: Array.isArray(studentData?.sports_interests)
      ? studentData.sports_interests.join(', ')
      : studentData?.sports_interests || '',
    student_id: studentData?.student_id || '', 
    year_level: studentData?.year_level || '', 
    gwa: studentData?.gwa || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
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

    try {
      await api.patch('/students/update-portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onRefresh) await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrorMsg("Failed to update academic profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccess && <SuccessBanner message="Academic profile updated" />}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-wider rounded-2xl">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Student ID">
          <input
            type="text"
            placeholder="e.g. 2026-00123-MN-0"
            maxLength={20}
            className={inputCls}
            value={form.student_id}
            onChange={e => setForm({ ...form, student_id: e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20) })}
          />
        </Field>
        <Field label="Academic Level">
          <select
            className={inputCls}
            value={form.year_level}
            onChange={e => setForm({ ...form, year_level: e.target.value })}
          >
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
      
      <Field label="GWA">
        <input
          type="number"
          step="0.01"
          min="1.00"
          max="5.00"
          placeholder="e.g. 1.50"
          className={inputCls}
          value={form.gwa}
          onChange={e => setForm({ ...form, gwa: e.target.value })}
        />
      </Field>

      <Field label="About Yourself (Bio)">
        <textarea
          placeholder="Write a short summary..."
          className={`${inputCls} resize-none min-h-[100px]`}
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
        />
      </Field>

      <Field label="Current College / University">
        <select
          className={inputCls}
          value={form.college_id}
          onChange={e => setForm({ ...form, college_id: e.target.value, other_school: e.target.value === 'Others' ? form.other_school : '' })}
        >
          <option value="">Select your school</option>
          {colleges.map((col) => <option key={col.id} value={col.id}>{col.name}</option>)}
          <option value="Others">Others (Specify below)</option>
        </select>
        {form.college_id === 'Others' && (
          <input
            type="text"
            placeholder="Enter school name..."
            className={`${inputCls} mt-3`}
            value={form.other_school}
            onChange={e => setForm({ ...form, other_school: e.target.value })}
          />
        )}
      </Field>

      <Field label="Degree Program / Course">
        <select
          className={inputCls}
          value={form.course_id}
          onChange={e => setForm({ ...form, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? form.other_degree_program : '' })}
        >
          <option value="">Select your course</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          <option value="Others">Others (Specify below)</option>
        </select>
        {form.course_id === 'Others' && (
          <input
            type="text"
            placeholder="Enter course name..."
            className={`${inputCls} mt-3`}
            value={form.other_degree_program}
            onChange={e => setForm({ ...form, other_degree_program: e.target.value })}
          />
        )}
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-2 mt-8"
      >
        {saving ? "Saving..." : <>Save Academic Info <ChevronRight size={20} stroke={2.5}/></>}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// 2. PERSONAL SECTION
// ─────────────────────────────────────────────────────────
function PersonalSection({ studentData, onRefresh }) {
  const [form, setForm] = useState({
    scontact_number: studentData?.scontact_number || '',
    sstreet: studentData?.sstreet || '',
    sbarangay: studentData?.sbarangay || '',
    sgender: studentData?.sgender || '',
    religion: studentData?.religion || '',
    other_religion: studentData?.other_religion || ''
  });

  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    if (form.scontact_number && form.scontact_number.length !== 11) {
      setErrorMsg("Contact number must be exactly 11 digits long and start with 9.");
      setSaving(false); return;
    }

    try {
      await api.put(`/students/personal-info/me`, form);
      if (onRefresh) await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrorMsg("Failed to update records.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccess && <SuccessBanner message="Personal info updated" />}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-wider rounded-2xl">{errorMsg}</div>
      )}

      <Field label="Contact Number">
        <input
          type="text"
          placeholder="e.g. 9123456789"
          className={inputCls}
          value={form.scontact_number}
          onChange={e => setForm(prev => ({ ...prev, scontact_number: sanitizeContact(e.target.value, prev.scontact_number) }))}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Street Address">
          <input
            type="text"
            placeholder="House No. & Street"
            className={inputCls}
            value={form.sstreet}
            onChange={e => setForm({ ...form, sstreet: e.target.value })}
          />
        </Field>
        <Field label="Barangay">
          <input
            type="text"
            placeholder="Barangay"
            className={inputCls}
            value={form.sbarangay}
            onChange={e => setForm({ ...form, sbarangay: e.target.value })}
          />
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

      <button
        type="submit" disabled={saving}
        className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-2 mt-8"
      >
        {saving ? "Saving..." : <>Save Personal Info <ChevronRight size={20} stroke={2.5}/></>}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// 3. FAMILY SECTION
// ─────────────────────────────────────────────────────────
function FamilySection({ studentData, onRefresh }) {
  const [form, setForm] = useState({
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

  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContactChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: sanitizeContact(value, prev[field]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    const phoneFields = ['mother_contact', 'father_contact', 'guardian_contact'];
    for (const key of phoneFields) {
      const val = form[key];
      if (val && val.length !== 11) {
        setErrorMsg("Contact numbers must be exactly 11 digits long and start with 9.");
        setSaving(false); return;
      }
    }

    try {
      await api.put(`/students/parent-profile/me`, form);
      if (onRefresh) await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrorMsg("Failed to update family records.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {showSuccess && <SuccessBanner message="Family records updated" />}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-wider rounded-2xl">{errorMsg}</div>
      )}

      <div>
        <p className="text-xs font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Mother's Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <input type="text" placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} />
          <input type="text" maxLength={11} placeholder="Contact Number" className={inputCls} value={form.mother_contact} onChange={e => handleContactChange('mother_contact', e.target.value)} />
          <input type="text" placeholder="Occupation" className={inputCls} value={form.mother_occupation} onChange={e => setForm({ ...form, mother_occupation: e.target.value })} />
        </div>
      </div>

      <div className="pt-6 border-t border-black/5">
        <p className="text-xs font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Father's Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <input type="text" placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} />
          <input type="text" maxLength={11} placeholder="Contact Number" className={inputCls} value={form.father_contact} onChange={e => handleContactChange('father_contact', e.target.value)} />
          <input type="text" placeholder="Occupation" className={inputCls} value={form.father_occupation} onChange={e => setForm({ ...form, father_occupation: e.target.value })} />
        </div>
      </div>

      <div className="pt-6 border-t border-black/5">
        <p className="text-xs font-black text-[#093fb4] uppercase tracking-[0.2em] mb-4">Guardian Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <input type="text" placeholder="Full Name" className={`${inputCls} sm:col-span-2`} value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
          <input type="text" maxLength={11} placeholder="Contact Number" className={inputCls} value={form.guardian_contact} onChange={e => handleContactChange('guardian_contact', e.target.value)} />
          <input type="text" placeholder="Relationship / Occupation" className={inputCls} value={form.guardian_occupation} onChange={e => setForm({ ...form, guardian_occupation: e.target.value })} />
        </div>
      </div>

      <div className="pt-6 border-t border-black/5">
        <Field label="Family Household Address">
          <textarea
            placeholder="Enter complete family residential home address..."
            className={`${inputCls} resize-none min-h-[100px]`}
            value={form.house_address}
            onChange={e => setForm({ ...form, house_address: e.target.value })}
          />
        </Field>
      </div>

      <button
        type="submit" disabled={saving}
        className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-2 mt-8"
      >
        {saving ? "Saving..." : <>Save Family Info <ChevronRight size={20} stroke={2.5}/></>}
      </button>
    </form>
  );
}