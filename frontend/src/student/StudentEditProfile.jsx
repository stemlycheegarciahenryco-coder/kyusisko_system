import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, School, User, Users, ChevronRight } from 'lucide-react';
import api from '../api';

// Shared helper: enforces 11 digits max, must start with 9, strips non-numeric chars
function sanitizeContact(rawValue, currentValue) {
  let cleaned = rawValue.replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned[0] !== '9') return currentValue;
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
  return cleaned;
}

const TABS = [
  { key: 'academic', label: 'Academic Profile', icon: School },
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'family', label: 'Family & Guardian', icon: Users },
];

export default function StudentEditProfile({ initialTab = 'academic', studentData, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto transition-all">
        <div className="h-1.5 bg-[#093fb4]" />

        {/* Shell Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-black uppercase tracking-tight">Edit My Profile</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
              Keep your academic, personal, and family records up to date
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center text-slate-500 hover:text-[#093fb4] hover:border-[#093fb4] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 px-8 border-b border-slate-200">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                  isActive
                    ? 'border-[#093fb4] text-[#093fb4]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content (Using "hidden" to persist form state across tab changes) */}
        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin text-left">
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
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-[#093fb4] text-sm font-bold rounded-xl flex items-center gap-3">
      <CheckCircle2 size={20} className="shrink-0" /> {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 1. ACADEMIC PROFILE SECTION
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
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      }
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
      console.error("Upload error:", err);
      setErrorMsg("Failed to update academic profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccess && <SuccessBanner message="Academic profile updated successfully." />}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Student ID</label>
          <input
            type="text"
            placeholder="e.g. 2026-00123-MN-0"
            maxLength={20}
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
            value={form.student_id}
            onChange={e => {
              const sanitized = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);
              setForm({ ...form, student_id: sanitized });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Year / Level</label>
          <select
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-slate-800 cursor-pointer transition-all"
            value={form.year_level}
            onChange={e => setForm({ ...form, year_level: e.target.value })}
          >
            <option value="">Select Education Level</option>
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Graduate">Graduate</option>
            <option value="PostGraduate">PostGraduate</option>
            <option value="Masters">Masters</option>
            <option value="Doctorate">Doctorate</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">GWA</label>
        <input
          type="number"
          step="0.01"
          min="1.00"
          max="5.00"
          placeholder="e.g. 1.50"
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
          value={form.gwa}
          onChange={e => setForm({ ...form, gwa: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">About Yourself (Bio)</label>
        <textarea
          placeholder="Write a short summary about yourself..."
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base text-black font-medium transition-all resize-none min-h-[100px]"
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Current College / University</label>
        <select
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-slate-800 cursor-pointer transition-all"
          value={form.college_id}
          onChange={e => setForm({ ...form, college_id: e.target.value, other_school: e.target.value === 'Others' ? form.other_school : '' })}
        >
          <option value="">Select your school</option>
          {colleges.map((col) => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
          <option value="Others">Others (Specify below)</option>
        </select>
        {form.college_id === 'Others' && (
          <input
            type="text"
            placeholder="Enter school name..."
            className="w-full mt-3 p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
            value={form.other_school}
            onChange={e => setForm({ ...form, other_school: e.target.value })}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Degree Program / Course</label>
        <select
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-slate-800 cursor-pointer transition-all"
          value={form.course_id}
          onChange={e => setForm({ ...form, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? form.other_degree_program : '' })}
        >
          <option value="">Select your course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
          <option value="Others">Others (Specify below)</option>
        </select>
        {form.course_id === 'Others' && (
          <input
            type="text"
            placeholder="Enter course name..."
            className="w-full mt-3 p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
            value={form.other_degree_program}
            onChange={e => setForm({ ...form, other_degree_program: e.target.value })}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Sports Interests</label>
        <input
          type="text"
          placeholder="Basketball, Volleyball, Chess (Comma separated)"
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
          value={form.sports_interests}
          onChange={e => setForm({ ...form, sports_interests: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#093fb4] text-white py-4 mt-2 rounded-xl font-bold text-base uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>Save Academic Info <ChevronRight size={18} /></>
        )}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// 2. PERSONAL INFO SECTION
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
      setSaving(false);
      return;
    }

    try {
      await api.put(`/students/personal-info/me`, form);
      if (onRefresh) await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating personal info:", err);
      setErrorMsg("Failed to update records. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccess && <SuccessBanner message="Personal info updated successfully." />}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Contact Number</label>
        <input
          type="text"
          placeholder="e.g. 9123456789"
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
          value={form.scontact_number}
          onChange={e => setForm(prev => ({ ...prev, scontact_number: sanitizeContact(e.target.value, prev.scontact_number) }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Street Address</label>
          <input
            type="text"
            placeholder="House No. & Street"
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
            value={form.sstreet}
            onChange={e => setForm({ ...form, sstreet: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Barangay</label>
          <input
            type="text"
            placeholder="Barangay"
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
            value={form.sbarangay}
            onChange={e => setForm({ ...form, sbarangay: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Gender</label>
          <select
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-slate-800 cursor-pointer transition-all"
            value={form.sgender}
            onChange={e => setForm({ ...form, sgender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Religion</label>
          <select
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-slate-800 cursor-pointer transition-all"
            value={form.religion}
            onChange={e => setForm({ ...form, religion: e.target.value, other_religion: e.target.value === 'Others' ? form.other_religion : '' })}
          >
            <option value="">Select Religion</option>
            <option value="Roman Catholic">Roman Catholic</option>
            <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
            <option value="Islam">Islam</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      {form.religion === 'Others' && (
        <div>
          <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-2">Specify Religion</label>
          <input
            type="text"
            placeholder="Enter religion..."
            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
            value={form.other_religion}
            onChange={e => setForm({ ...form, other_religion: e.target.value })}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#093fb4] text-white py-4 mt-2 rounded-xl font-bold text-base uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving Info...
          </>
        ) : (
          <>Save Personal Info <ChevronRight size={18} /></>
        )}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// 3. FAMILY & CARETAKER SECTION
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
        setSaving(false);
        return;
      }
    }

    try {
      await api.put(`/students/parent-profile/me`, form);
      if (onRefresh) await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving family profile info:", err);
      if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Failed to update family records. Please check inputs.");
      }
    } finally {
      setSaving(false);
    }
  };

  const uniformInputStyle = "p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {showSuccess && <SuccessBanner message="Family records updated successfully." />}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* MOTHER SECTION */}
      <div>
        <p className="text-sm font-black text-[#093fb4] uppercase tracking-widest mb-3">Mother's Information (Optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Mother's Full Name"
            className={`${uniformInputStyle} sm:col-span-2`}
            value={form.mother_name}
            onChange={e => setForm({ ...form, mother_name: e.target.value })}
          />
          <input
            type="text"
            maxLength={11}
            placeholder="Contact Number (e.g. 9123456789)"
            className={uniformInputStyle}
            value={form.mother_contact}
            onChange={e => handleContactChange('mother_contact', e.target.value)}
          />
          <input
            type="text"
            placeholder="Occupation"
            className={uniformInputStyle}
            value={form.mother_occupation}
            onChange={e => setForm({ ...form, mother_occupation: e.target.value })}
          />
        </div>
      </div>

      {/* FATHER SECTION */}
      <div className="pt-6 border-t border-slate-200">
        <p className="text-sm font-black text-[#093fb4] uppercase tracking-widest mb-3">Father's Information (Optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Father's Full Name"
            className={`${uniformInputStyle} sm:col-span-2`}
            value={form.father_name}
            onChange={e => setForm({ ...form, father_name: e.target.value })}
          />
          <input
            type="text"
            maxLength={11}
            placeholder="Contact Number (e.g. 9123456789)"
            className={uniformInputStyle}
            value={form.father_contact}
            onChange={e => handleContactChange('father_contact', e.target.value)}
          />
          <input
            type="text"
            placeholder="Occupation"
            className={uniformInputStyle}
            value={form.father_occupation}
            onChange={e => setForm({ ...form, father_occupation: e.target.value })}
          />
        </div>
      </div>

      {/* GUARDIAN SECTION */}
      <div className="pt-6 border-t border-slate-200">
        <p className="text-sm font-black text-[#093fb4] uppercase tracking-widest mb-3 flex items-center gap-2">
          Guardian Backup Details <span className="text-slate-500 font-normal normal-case">(Optional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Guardian Full Name"
            className={`${uniformInputStyle} sm:col-span-2`}
            value={form.guardian_name}
            onChange={e => setForm({ ...form, guardian_name: e.target.value })}
          />
          <input
            type="text"
            maxLength={11}
            placeholder="Guardian Contact Number"
            className={uniformInputStyle}
            value={form.guardian_contact}
            onChange={e => handleContactChange('guardian_contact', e.target.value)}
          />
          <input
            type="text"
            placeholder="Relationship / Occupation"
            className={uniformInputStyle}
            value={form.guardian_occupation}
            onChange={e => setForm({ ...form, guardian_occupation: e.target.value })}
          />
        </div>
      </div>

      {/* HOUSING ADDRESS FIELD */}
      <div className="pt-6 border-t border-slate-200">
        <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest mb-3">Family Household Address</label>
        <textarea
          placeholder="Enter complete family residential home address..."
          className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base text-black font-medium transition-all resize-none min-h-[100px]"
          value={form.house_address}
          onChange={e => setForm({ ...form, house_address: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#093fb4] text-white py-4 mt-2 rounded-xl font-bold text-base uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving Records...
          </>
        ) : (
          <>Save Family Info <ChevronRight size={18} /></>
        )}
      </button>
    </form>
  );
}