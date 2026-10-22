import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Loader2, ClipboardList } from 'lucide-react';
import api from '../api';

const RELIGIONS = ["Roman Catholic", "Islam", "Iglesia ni Cristo", "Christianity"].sort();
const POPULAR_SPORTS = ["Basketball", "Volleyball", "Football", "Taekwondo", "Swimming", "Badminton", "Table Tennis", "Chess"];
const PROGRAM_TYPES = [
  'AICS (Assistance to Individuals in Crisis Situations)',
  'SLP (Sustainable Livelihood Program)',
  'MaPa Program (Masayang Pamilya Para sa Batang Pilipino)',
  'Others'
];

const EMPTY = {
  college_id: '', other_school: '',
  course_id: '', other_course: '',
  is_athlete: '', sports: [], other_sport: '',
  religion: '', other_religion: '',
  is_indigenous: '', indigenous_group: '',
  is_pwd: '', is_working_student: '',
  is_poverty_program: '', program_type: '', other_program: ''
};

// Saved DB row -> form shape
const mapProfileToForm = (p) => {
  const religion = p.religion || '';
  const religionInList = RELIGIONS.includes(religion);
  const notEnrolled = (v) => v === 'Currently not enrolled';
  return {
    college_id: p.college_id ? String(p.college_id) : notEnrolled(p.other_school) ? 'NOT_ENROLLED' : p.other_school ? 'OTHERS' : '',
    other_school: p.college_id || notEnrolled(p.other_school) ? '' : (p.other_school || ''),
    course_id: p.course_id ? String(p.course_id) : notEnrolled(p.other_degree_program) ? 'NOT_ENROLLED' : p.other_degree_program ? 'OTHERS' : '',
    other_course: p.course_id || notEnrolled(p.other_degree_program) ? '' : (p.other_degree_program || ''),
    is_athlete: p.is_athlete ? 'Yes' : 'No',
    sports: Array.isArray(p.sports_interests) ? p.sports_interests : [],
    other_sport: p.other_sport || '',
    religion: religion ? (religionInList ? religion : 'Others') : '',
    other_religion: religion && !religionInList ? religion : '',
    is_indigenous: p.is_indigenous ? 'Yes' : 'No',
    indigenous_group: p.indigenous_group || '',
    is_pwd: p.is_pwd ? 'Yes' : 'No',
    is_working_student: p.is_working_student ? 'Yes' : 'No',
    is_poverty_program: p.is_poverty_program ? 'Yes' : 'No',
    program_type: p.program_type || '',
    other_program: p.other_program || ''
  };
};

const labelStyle = "block text-[11px] font-black text-black/60 uppercase tracking-widest mb-2";
const inputStyle = "w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#093fb4] focus:bg-white transition-all";
const chipOn = "bg-[#093fb4] text-white border-[#093fb4]";
const chipOff = "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#093fb4]/50";

function YesNo({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {['Yes', 'No'].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`py-3 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all ${value === opt ? chipOn : chipOff}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
      <p className={labelStyle}>{title}</p>
      {children}
    </div>
  );
}

export default function StudentEligibilityModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c] = await Promise.all([api.get('/lookup/colleges'), api.get('/lookup/courses')]);
        setSchools(s.data);
        setCourses(c.data);
        try {
          const res = await api.get('/student-onboarding-profile');
          if (res.data?.profile) setForm(mapProfileToForm(res.data.profile));
        } catch (e) {
          // 404 = student never saved onboarding; start with an empty form
        }
      } catch (e) {
        setError('Could not load your saved details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleSport = (sport) =>
    set({ sports: form.sports.includes(sport) ? form.sports.filter((s) => s !== sport) : [...form.sports, sport] });

  const valid =
    form.college_id !== '' &&
    form.course_id !== '' &&
    form.is_athlete !== '' &&
    !(form.is_athlete === 'Yes' && form.sports.length === 0) &&
    !(form.sports.includes('Others') && !form.other_sport.trim()) &&
    form.religion !== '' &&
    !(form.religion === 'Others' && !form.other_religion.trim()) &&
    form.is_indigenous !== '' &&
    !(form.is_indigenous === 'Yes' && !form.indigenous_group.trim()) &&
    form.is_pwd !== '' &&
    form.is_working_student !== '' &&
    form.is_poverty_program !== '' &&
    !(form.is_poverty_program === 'Yes' && (!form.program_type || (form.program_type === 'Others' && !form.other_program.trim()))) &&
    !(form.college_id === 'OTHERS' && !form.other_school.trim()) &&
    !(form.course_id === 'OTHERS' && !form.other_course.trim());

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        college_id: (form.college_id === 'NOT_ENROLLED' || form.college_id === 'OTHERS') ? null : parseInt(form.college_id, 10),
        other_school: form.college_id === 'OTHERS' ? form.other_school : (form.college_id === 'NOT_ENROLLED' ? 'Currently not enrolled' : null),
        course_id: (form.course_id === 'NOT_ENROLLED' || form.course_id === 'OTHERS') ? null : parseInt(form.course_id, 10),
        other_degree_program: form.course_id === 'OTHERS' ? form.other_course : (form.course_id === 'NOT_ENROLLED' ? 'Currently not enrolled' : null),
        religion: form.religion === 'Others' ? form.other_religion : form.religion,
        is_athlete: form.is_athlete === 'Yes',
        sports_interests: form.is_athlete === 'Yes' ? form.sports : [],
        other_sport: form.is_athlete === 'Yes' && form.sports.includes('Others') ? form.other_sport : null,
        is_indigenous: form.is_indigenous === 'Yes',
        indigenous_group: form.is_indigenous === 'Yes' ? form.indigenous_group : null,
        is_pwd: form.is_pwd === 'Yes',
        is_working_student: form.is_working_student === 'Yes',
        is_poverty_program: form.is_poverty_program === 'Yes',
        program_type: form.is_poverty_program === 'Yes' ? form.program_type : null,
        other_program: form.is_poverty_program === 'Yes' && form.program_type === 'Others' ? form.other_program : null
      };
      await api.post('/student-onboarding-profile', payload);
      localStorage.setItem('isProfileComplete', 'true');
      if (onSaved) await onSaved();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#093fb4] flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Eligibility Details</h2>
              <p className="text-xs text-slate-500 font-medium">Used to match you with scholarships</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {loading ? (
            <div className="py-16 flex justify-center text-[#093fb4]"><Loader2 className="animate-spin" size={32} /></div>
          ) : (
            <>
              <Section title="School">
                <select className={inputStyle} value={form.college_id} onChange={(e) => set({ college_id: e.target.value, other_school: '' })}>
                  <option value="">Select school...</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="OTHERS">Others (Please Specify)</option>
                  <option value="NOT_ENROLLED">Currently not enrolled</option>
                </select>
                {form.college_id === 'OTHERS' && (
                  <input className={inputStyle} placeholder="Specify your school" value={form.other_school} onChange={(e) => set({ other_school: e.target.value })} />
                )}
              </Section>

              <Section title="Degree Program">
                <select className={inputStyle} value={form.course_id} onChange={(e) => set({ course_id: e.target.value, other_course: '' })}>
                  <option value="">Select course...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="OTHERS">Others (Please Specify)</option>
                  <option value="NOT_ENROLLED">Currently not enrolled</option>
                </select>
                {form.course_id === 'OTHERS' && (
                  <input className={inputStyle} placeholder="Specify your course" value={form.other_course} onChange={(e) => set({ other_course: e.target.value })} />
                )}
              </Section>

              <Section title="Student Athlete">
                <YesNo value={form.is_athlete} onChange={(v) => set({ is_athlete: v, sports: v === 'No' ? [] : form.sports, other_sport: v === 'No' ? '' : form.other_sport })} />
                {form.is_athlete === 'Yes' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[...POPULAR_SPORTS, 'Others'].map((sport) => {
                        const on = form.sports.includes(sport);
                        return (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => toggleSport(sport)}
                            className={`px-3 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5 transition-all ${on ? chipOn : chipOff}`}
                          >
                            {sport} {on ? <X size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                    {form.sports.includes('Others') && (
                      <input className={inputStyle} placeholder="Enter other sports..." value={form.other_sport} onChange={(e) => set({ other_sport: e.target.value })} />
                    )}
                  </div>
                )}
              </Section>

              <Section title="Religion">
                <select className={inputStyle} value={form.religion} onChange={(e) => set({ religion: e.target.value, other_religion: '' })}>
                  <option value="">Select religion...</option>
                  {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="Others">Others (Please Specify)</option>
                </select>
                {form.religion === 'Others' && (
                  <input className={inputStyle} placeholder="Specify your religion" value={form.other_religion} onChange={(e) => set({ other_religion: e.target.value })} />
                )}
              </Section>

              <Section title="Indigenous Person">
                <YesNo value={form.is_indigenous} onChange={(v) => set({ is_indigenous: v, indigenous_group: v === 'No' ? '' : form.indigenous_group })} />
                {form.is_indigenous === 'Yes' && (
                  <input className={inputStyle} placeholder="Indigenous group / tribe" value={form.indigenous_group} onChange={(e) => set({ indigenous_group: e.target.value })} />
                )}
              </Section>

              <Section title="Person with Disability (PWD)">
                <YesNo value={form.is_pwd} onChange={(v) => set({ is_pwd: v })} />
              </Section>

              <Section title="Working Student">
                <YesNo value={form.is_working_student} onChange={(v) => set({ is_working_student: v })} />
              </Section>

              <Section title="Poverty Reduction Program Beneficiary">
                <YesNo value={form.is_poverty_program} onChange={(v) => set({ is_poverty_program: v, program_type: '', other_program: '' })} />
                {form.is_poverty_program === 'Yes' && (
                  <>
                    <select className={inputStyle} value={form.program_type} onChange={(e) => set({ program_type: e.target.value, other_program: '' })}>
                      <option value="">Select program...</option>
                      {PROGRAM_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {form.program_type === 'Others' && (
                      <input className={inputStyle} placeholder="Specify the program" value={form.other_program} onChange={(e) => set({ other_program: e.target.value })} />
                    )}
                  </>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          {error && <p className="text-xs font-bold text-red-600 mb-3">{error}</p>}
          {!loading && !valid && <p className="text-[11px] font-medium text-slate-500 mb-3">Complete every section to save.</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !valid || saving}
              className={`flex-[2] py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                ${loading || !valid || saving ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#093fb4] text-white hover:bg-[#073496] shadow-lg shadow-[#093fb4]/25 cursor-pointer'}`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}