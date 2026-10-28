import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, School, User, Users, Loader2, Pencil, Check, AlertCircle, ClipboardList, Plus, X, Sparkles } from 'lucide-react';
import api from '../api';
import { QuestionIcon } from '@phosphor-icons/react';

const QC_CITY_CODE = '137404000';

const RELIGIONS = ['Roman Catholic', 'Iglesia ni Cristo', 'Muslim', 'Christian'];
const POPULAR_SPORTS = ['Basketball', 'Volleyball', 'Football', 'Taekwondo', 'Swimming', 'Badminton', 'Table Tennis', 'Chess'];
const PROGRAM_TYPES = [
    'AICS (Assistance to Individuals in Crisis Situations)',
    'SLP (Sustainable Livelihood Program)',
    'MaPa Program (Masayang Pamilya Para sa Batang Pilipino)',
    'Others'
];

const mapOnboardingToForm = (p, fb) => {
    const notEnrolled = (v) => v === 'Currently not enrolled';
    const religion = p.religion || '';
    const religionInList = RELIGIONS.includes(religion);
    return {
        college_id: p.college_id ? p.college_id : notEnrolled(p.other_school) ? 'NOT_ENROLLED' : p.other_school ? 'Others' : fb.college_id,
        other_school: p.college_id || notEnrolled(p.other_school) ? '' : (p.other_school || ''),
        course_id: p.course_id ? p.course_id : notEnrolled(p.other_degree_program) ? 'NOT_ENROLLED' : p.other_degree_program ? 'Others' : fb.course_id,
        other_degree_program: p.course_id || notEnrolled(p.other_degree_program) ? '' : (p.other_degree_program || ''),
        ...(religion ? { religion: religionInList ? religion : 'Others', other_religion: religionInList ? '' : religion } : {}),
        is_athlete: p.is_athlete ? 'Yes' : 'No',
        sports: Array.isArray(p.sports_interests) ? p.sports_interests : [],
        other_sport: p.other_sport || '',
        is_indigenous: p.is_indigenous ? 'Yes' : 'No',
        indigenous_group: p.indigenous_group || '',
        is_pwd: p.is_pwd ? 'Yes' : 'No',
        is_working_student: p.is_working_student ? 'Yes' : 'No',
        is_poverty_program: p.is_poverty_program ? 'Yes' : 'No',
        program_type: p.program_type || '',
        other_program: p.other_program || ''
    };
};

const isEligibilityComplete = (f) =>
    f.is_athlete !== '' &&
    !(f.is_athlete === 'Yes' && f.sports.length === 0) &&
    !(f.is_athlete === 'Yes' && f.sports.includes('Others') && !f.other_sport.trim()) &&
    f.is_indigenous !== '' &&
    !(f.is_indigenous === 'Yes' && !f.indigenous_group.trim()) &&
    f.is_pwd !== '' &&
    f.is_working_student !== '' &&
    f.is_poverty_program !== '' &&
    !(f.is_poverty_program === 'Yes' && (!f.program_type || (f.program_type === 'Others' && !f.other_program.trim())));

const inputCls =
    "w-full px-3.5 py-2.5 bg-white border-2 border-black/20 rounded-xl focus:border-[#093fb4] outline-none transition-all placeholder:text-black/35 font-bold text-black text-sm";
const labelCls = "text-[11px] font-black text-black/70 uppercase ml-1 tracking-[0.12em] block mb-1.5";

const normalizePhone = (raw) => {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.startsWith('63') && d.length > 10) d = d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);
    return d.slice(0, 10);
};

function SectionTitle({ icon: Icon, title, description }) {
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
        </div>
    );
}

function Field({ label, children, isEditing, displayValue, className = '' }) {
    return (
        <div className={`space-y-1 min-w-0 ${className}`}>
            <label className={labelCls}>{label}</label>
            {isEditing ? (
                children
            ) : (
                <div className="w-full px-3.5 py-2.5 bg-gray-50/80 border-2 border-black/5 rounded-xl font-bold text-black/80 text-sm min-h-[42px] flex items-center">
                    {displayValue || <span className="text-black/30 font-normal italic">Not specified</span>}
                </div>
            )}
        </div>
    );
}

function YesNo({ value, onChange, disabled }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {['Yes', 'No'].map((opt) => (
                <button
                    key={opt}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(opt)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed ${value === opt
                        ? (disabled ? 'bg-gray-200 text-black/70 border-gray-300 shadow-none' : 'bg-[#093fb4] text-white border-[#093fb4]')
                        : (disabled ? 'bg-gray-50 text-black/30 border-black/5' : 'bg-white text-black/60 border-black/20 hover:border-[#093fb4]/60')
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

function ContactField({ label, value, onChange, disabled, error, isEditing }) {
    const formattedDisplay = value ? `+63 ${value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}` : '';

    return (
        <div className="space-y-1 min-w-0">
            <label className={labelCls}>{label}</label>
            {isEditing ? (
                <div
                    className={`flex items-stretch border-2 rounded-xl transition-all overflow-hidden bg-white ${error ? 'border-red-500' : 'border-black/20 focus-within:border-[#093fb4]'
                        }`}
                >
                    <div className="px-3 font-black border-r-2 flex items-center justify-center text-sm shrink-0 text-black/60 border-black/10 bg-black/5">
                        +63
                    </div>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9XXXXXXXXX"
                        value={value}
                        onChange={onChange}
                        className="w-full min-w-0 px-3 py-2.5 bg-transparent outline-none font-bold text-black text-sm placeholder:text-black/30"
                    />
                </div>
            ) : (
                <div className="w-full px-3.5 py-2.5 bg-gray-50/80 border-2 border-black/5 rounded-xl font-bold text-black/80 text-sm min-h-[42px] flex items-center">
                    {formattedDisplay || <span className="text-black/30 font-normal italic">Not specified</span>}
                </div>
            )}
            {error && <p className="text-[10px] font-black text-red-600 uppercase tracking-wider ml-1 mt-1">{error}</p>}
        </div>
    );
}

export default function StudentEditProfile({ studentData, onRefresh, onStudentProfileTour }) {
    const topRef = useRef(null);
    const submitRef = useRef(null);
    const sectionRefs = {
        academic: useRef(null),
        eligibility: useRef(null),
        personal: useRef(null),
        family: useRef(null),
    };

    const [form, setForm] = useState({
        bio: studentData?.bio || '',
        college_id: '',
        course_id: '',
        other_school: studentData?.other_school || '',
        other_degree_program: studentData?.other_degree_program || '',
        is_athlete: '',
        sports: Array.isArray(studentData?.sports_interests) ? studentData.sports_interests : [],
        other_sport: '',
        is_indigenous: '',
        indigenous_group: '',
        is_pwd: '',
        is_working_student: '',
        is_poverty_program: '',
        program_type: '',
        other_program: '',
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

    const [editMode, setEditMode] = useState({ academic: false, eligibility: false, personal: false, family: false });
    const [hasOnboardingRow, setHasOnboardingRow] = useState(false);
    const [hasEdited, setHasEdited] = useState(false);
    const [colleges, setColleges] = useState([]);
    const [courses, setCourses] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [isTourRunning, setIsTourRunning] = useState(false);
    const [activeTourSection, setActiveTourSection] = useState(null); 
    const [incompleteProfile, setIncompleteProfile] = useState(false);

    const isGloballyEditing = editMode.academic || editMode.eligibility || editMode.personal || editMode.family;

    const handleToggleGlobalEdit = () => {
        if (isTourRunning) return;
        if (isGloballyEditing) {
            setEditMode({ academic: false, eligibility: false, personal: false, family: false });
            setFieldErrors({});
        } else {
            setEditMode({ academic: true, eligibility: true, personal: true, family: true });
            setHasEdited(true);
        }
    };

    const runSpecialTour = async () => {
        const smoothScrollToTop = (duration = 800) => {
            const startPosition = window.pageYOffset;
            const startTime = performance.now();
            const easeInOutCubic = (t) => {
                return t < 0.5
                    ? 4 * t * t * t
                    : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            };
            const animation = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const ease = easeInOutCubic(progress);
                window.scrollTo(0, startPosition * (1 - ease));
                if (progress < 1) {
                    requestAnimationFrame(animation);
                }
            };
            requestAnimationFrame(animation);
        };
        const sections = ['academic', 'eligibility', 'personal', 'family'];
        setIsTourRunning(true);

        setEditMode({ academic: true, eligibility: true, personal: true, family: true });
        setHasEdited(true);

        for (let i = 0; i < sections.length; i++) {
            const currentSec = sections[i];
            setActiveTourSection(currentSec);

            const el = sectionRefs[currentSec]?.current;
            if (el) {
                const elementRect = el.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const offsetPosition = absoluteElementTop - (window.innerHeight / 2) + 120;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setEditMode({ academic: false, eligibility: false, personal: false, family: false });

        setActiveTourSection('submit');
        const submitEl = submitRef?.current;
        if (submitEl) {
            submitEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        setActiveTourSection(null);
        smoothScrollToTop();
        await onStudentProfileTour();
        setIsTourRunning(false);
    };

    const check_incomplete = () => {
        const incompleteProfile = localStorage.getItem('incomplete_profile');
        setIncompleteProfile(incompleteProfile);

        if (incompleteProfile === 'true') {
            runSpecialTour();
        }
    };

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
                if (studentData?.other_school === 'Currently not enrolled') {
                    matchedCollegeId = 'NOT_ENROLLED';
                } else if (studentData?.other_school) {
                    matchedCollegeId = 'Others';
                } else if (studentData?.college_name) {
                    const found = collegeRes.data.find(c => c.name === studentData.college_name);
                    if (found) matchedCollegeId = found.id;
                }

                let matchedCourseId = '';
                if (studentData?.other_degree_program === 'Currently not enrolled') {
                    matchedCourseId = 'NOT_ENROLLED';
                } else if (studentData?.other_degree_program) {
                    matchedCourseId = 'Others';
                } else if (studentData?.course_name) {
                    const found = courseRes.data.find(c => c.name === studentData.course_name);
                    if (found) matchedCourseId = found.id;
                }

                let patch = { college_id: matchedCollegeId, course_id: matchedCourseId };

                try {
                    const profileRes = await api.get('/student-onboarding-profile');
                    if (profileRes.data?.profile) {
                        setHasOnboardingRow(true);
                        patch = { ...patch, ...mapOnboardingToForm(profileRes.data.profile, patch) };
                    }
                } catch (e) { }

                setForm(prev => ({ ...prev, ...patch }));
            } catch (err) { }
        };

        fetchLookups();
    }, [studentData]);

    useEffect(() => {
        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${QC_CITY_CODE}/barangays/`)
            .then(res => res.json())
            .then(data => setBarangays([...data].sort((a, b) => a.name.localeCompare(b.name))))
            .catch(err => console.error('Error fetching barangays:', err));

        check_incomplete();
    }, []);

    const validateAll = () => {
        const errors = {};
        const phoneError = 'Enter a valid 10-digit number starting with 9';
        let firstErrorSection = null;

        // Personal
        if (form.scontact_number && form.scontact_number.length !== 10) {
            errors.scontact_number = phoneError;
            if (!firstErrorSection) firstErrorSection = 'personal';
        }
        if (form.szip_code && !/^\d{4}$/.test(form.szip_code)) {
            errors.szip_code = 'Postal code must be exactly 4 digits';
            if (!firstErrorSection) firstErrorSection = 'personal';
        }

        // Eligibility
        if (!isEligibilityComplete(form)) {
            errors.eligibility = 'Answer every question (and pick at least one sport if you are an athlete).';
            if (!firstErrorSection) firstErrorSection = 'eligibility';
        }

        // Family
        ['mother_contact', 'father_contact', 'guardian_contact'].forEach(key => {
            if (form[key] && form[key].length !== 10) {
                errors[key] = phoneError;
                if (!firstErrorSection) firstErrorSection = 'family';
            }
        });

        return { errors, firstErrorSection };
    };

    const toggleSport = (sport) => {
        if (isTourRunning) return;
        setForm(prev => ({
            ...prev,
            sports: prev.sports.includes(sport) ? prev.sports.filter(s => s !== sport) : [...prev.sports, sport]
        }));
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

        const { errors, firstErrorSection } = validateAll();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...errors }));

            // Scroll to the first section containing an error smoothly
            if (firstErrorSection && sectionRefs[firstErrorSection]?.current) {
                const el = sectionRefs[firstErrorSection].current;
                const elementRect = el.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const offsetPosition = absoluteElementTop - (window.innerHeight / 2) + 120;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('bio', form.bio);
            const schoolNotEnrolled = form.college_id === 'NOT_ENROLLED';
            const courseNotEnrolled = form.course_id === 'NOT_ENROLLED';
            const sportsList = form.is_athlete === 'Yes'
                ? form.sports.map(s => (s === 'Others' && form.other_sport.trim() ? form.other_sport.trim() : s))
                : [];

            formData.append('college_id', schoolNotEnrolled ? '' : form.college_id);
            formData.append('course_id', courseNotEnrolled ? '' : form.course_id);
            formData.append('other_school', schoolNotEnrolled ? 'Currently not enrolled' : form.other_school);
            formData.append('other_degree_program', courseNotEnrolled ? 'Currently not enrolled' : form.other_degree_program);
            formData.append('sports_interests', sportsList.join(', '));
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

            if (hasOnboardingRow || isEligibilityComplete(form)) {
                await api.post('/student-onboarding-profile', {
                    college_id: (schoolNotEnrolled || form.college_id === 'Others' || form.college_id === '') ? null : parseInt(form.college_id, 10),
                    other_school: form.college_id === 'Others' ? form.other_school : (schoolNotEnrolled ? 'Currently not enrolled' : null),
                    course_id: (courseNotEnrolled || form.course_id === 'Others' || form.course_id === '') ? null : parseInt(form.course_id, 10),
                    other_degree_program: form.course_id === 'Others' ? form.other_degree_program : (courseNotEnrolled ? 'Currently not enrolled' : null),
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
                });
                setHasOnboardingRow(true);
                setIncompleteProfile(false);
                localStorage.setItem('incomplete_profile', false);
            }

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

            setEditMode({ academic: false, eligibility: false, personal: false, family: false });
            setFieldErrors({});

            const selectedCollege = colleges.find(c => String(c.id) === String(form.college_id));
            const selectedCourse = courses.find(c => String(c.id) === String(form.course_id));
            const optimisticPatch = { ...form, sports_interests: sportsList, college_name: selectedCollege?.name || '', course_name: selectedCourse?.name || '' };

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

    const getCollegeDisplayName = () => {
        if (form.college_id === 'NOT_ENROLLED') return 'Currently not enrolled';
        if (form.college_id === 'Others') return form.other_school;
        const found = colleges.find(c => String(c.id) === String(form.college_id));
        return found ? found.name : form.other_school;
    };

    const getCourseDisplayName = () => {
        if (form.course_id === 'NOT_ENROLLED') return 'Currently not enrolled';
        if (form.course_id === 'Others') return form.other_degree_program;
        const found = courses.find(c => String(c.id) === String(form.course_id));
        return found ? found.name : form.other_degree_program;
    };

    const getReligionDisplayName = () => {
        if (form.religion === 'Others') return form.other_religion;
        return form.religion;
    };

    return (
        <div ref={topRef} className="max-w-4xl mx-auto space-y-8 antialiased relative">
            {isTourRunning && (
                <div className="absolute inset-0 z-50 cursor-not-allowed bg-transparent" />
            )}

            <div className={`bg-white/75 backdrop-blur-xl border-2 border-white/80 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all ${isTourRunning ? 'pointer-events-none' : ''}`}>
                {showSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-inner border-2 border-emerald-100">
                            <CheckCircle2 size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Profile Updated!</h3>
                        <p className="text-xs text-black/60 font-bold leading-relaxed mb-6">
                            Your academic, eligibility, personal, and family information has been successfully saved.
                        </p>
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="w-full bg-[#093fb4] hover:bg-[#073496] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#093fb4]/25 active:scale-95"
                        >
                            Continue Editing
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSaveAll} noValidate className="flex flex-col">
                        <div className="px-8 md:px-12 pt-8 pb-6 border-b-2 border-black/5 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-black uppercase tracking-tight">Profile</h2>
                                <p className="text-[11px] font-black text-black/40 uppercase tracking-[0.18em] mt-1">
                                    Update student information
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={isTourRunning}
                                        onClick={runSpecialTour}
                                        className="flex items-center justify-center w-9 h-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                                    >
                                        {isTourRunning ? <Loader2 size={15} className="animate-spin text-[#093fb4]" /> : <QuestionIcon size={16} className="text-[#093fb4]" />}
                                    </button>
                                </div>

                                <div className="flex justify-between items-center px-0 py-1 rounded-2xl">
                                    <button
                                        type="button"
                                        disabled={isTourRunning}
                                        onClick={handleToggleGlobalEdit}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 shrink-0 ${isTourRunning ? 'opacity-50 cursor-not-allowed' : ''
                                            } ${isGloballyEditing
                                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-sm'
                                                : 'bg-white text-[#093fb4] border-[#093fb4]/20 hover:border-[#093fb4] shadow-sm'
                                            }`}
                                    >
                                        {isGloballyEditing ? (
                                            <><X size={14} strokeWidth={3} /> Cancel</>
                                        ) : (
                                            <><Pencil size={14} strokeWidth={2.5} /> Edit Profile</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 md:px-12 py-8 text-left space-y-2">
                            {globalError && (
                                <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-200 text-red-600 text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center gap-2.5">
                                    <AlertCircle size={18} strokeWidth={2.5} className="shrink-0" /> {globalError}
                                </div>
                            )}

                            {/* ================= 1. ACADEMIC ================= */}
                            <div
                                ref={sectionRefs.academic}
                                className={`transition-all duration-300 rounded-3xl relative ${activeTourSection === 'academic' ? 'border-2 border-[#093fb4] ring-4 ring-[#093fb4]/30 shadow-xl p-4 bg-blue-50/10' : ''}`}
                            >
                                {activeTourSection === 'academic' && (
                                    <div className="absolute -top-10 left-4 z-20 bg-[#093fb4] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2">
                                        <span>Editing Academic Information...</span>
                                    </div>
                                )}
                                <SectionTitle
                                    icon={School}
                                    title="Academic Information"
                                    description="School, course, and grades"
                                />
                                <div className="space-y-4 mb-7 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Field label="Student ID" isEditing={editMode.academic} displayValue={form.student_id}>
                                            <input
                                                type="text"
                                                placeholder="2026-00123"
                                                maxLength={20}
                                                className={inputCls}
                                                value={form.student_id}
                                                onChange={e => setForm(prev => ({ ...prev, student_id: e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20) }))}
                                            />
                                        </Field>
                                        <Field label="Academic Level" isEditing={editMode.academic} displayValue={form.year_level}>
                                            <select
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
                                        <Field label="GWA (%)" isEditing={editMode.academic} displayValue={form.gwa ? `${form.gwa}%` : ''}>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
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

                                    <Field label="Current College / University" isEditing={editMode.academic} displayValue={getCollegeDisplayName()}>
                                        <select
                                            className={inputCls}
                                            value={form.college_id}
                                            onChange={e => setForm(prev => ({ ...prev, college_id: e.target.value, other_school: e.target.value === 'Others' ? prev.other_school : '' }))}
                                        >
                                            <option value="">Select your school</option>
                                            {colleges.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
                                            <option value="Others">Others (Specify below)</option>
                                            <option value="NOT_ENROLLED">Currently not enrolled</option>
                                        </select>
                                        {form.college_id === 'Others' && (
                                            <input
                                                type="text"
                                                placeholder="Enter school name..."
                                                className={`${inputCls} mt-2`}
                                                value={form.other_school}
                                                onChange={e => setForm(prev => ({ ...prev, other_school: e.target.value }))}
                                            />
                                        )}
                                    </Field>

                                    <Field label="Degree Program / Course" isEditing={editMode.academic} displayValue={getCourseDisplayName()}>
                                        <select
                                            className={inputCls}
                                            value={form.course_id}
                                            onChange={e => setForm(prev => ({ ...prev, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? prev.other_degree_program : '' }))}
                                        >
                                            <option value="">Select your course</option>
                                            {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                                            <option value="Others">Others (Specify below)</option>
                                            <option value="NOT_ENROLLED">Currently not enrolled</option>
                                        </select>
                                        {form.course_id === 'Others' && (
                                            <input
                                                type="text"
                                                placeholder="Enter course name..."
                                                className={`${inputCls} mt-2`}
                                                value={form.other_degree_program}
                                                onChange={e => setForm(prev => ({ ...prev, other_degree_program: e.target.value }))}
                                            />
                                        )}
                                    </Field>

                                    <Field label="About Yourself (Bio)" isEditing={editMode.academic} displayValue={form.bio}>
                                        <textarea
                                            placeholder="Write a short summary..."
                                            className={`${inputCls} resize-none min-h-[84px]`}
                                            value={form.bio}
                                            onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                                        />
                                    </Field>
                                </div>
                            </div>

                            {/* ================= 2. ELIGIBILITY ================= */}
                            <div
                                ref={sectionRefs.eligibility}
                                className={`transition-all duration-300 rounded-3xl relative ${activeTourSection === 'eligibility' ? 'border-2 border-[#093fb4] ring-4 ring-[#093fb4]/30 shadow-xl p-4 bg-blue-50/10' : ''}`}
                            >
                                {activeTourSection === 'eligibility' && (
                                    <div className="absolute -top-10 left-4 z-20 bg-[#093fb4] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2">
                                        <span>Editing Eligibility Details...</span>
                                    </div>
                                )}
                                <SectionTitle
                                    icon={ClipboardList}
                                    title="Eligibility Details"
                                    description="Athletics and background used to match scholarships"
                                />
                                <div className="space-y-4 mb-7 pt-2">
                                    <Field label="Student Athlete" isEditing={editMode.eligibility} displayValue={form.is_athlete}>
                                        <YesNo
                                            value={form.is_athlete}
                                            disabled={!editMode.eligibility}
                                            onChange={(v) => { setForm(prev => ({ ...prev, is_athlete: v, sports: v === 'No' ? [] : prev.sports, other_sport: v === 'No' ? '' : prev.other_sport })); clearError('eligibility'); }}
                                        />
                                    </Field>

                                    {form.is_athlete === 'Yes' && (
                                        <Field
                                            label="Sports"
                                            isEditing={editMode.eligibility}
                                            displayValue={form.sports.map(s => s === 'Others' ? form.other_sport : s).filter(Boolean).join(', ')}
                                        >
                                            <div className="flex flex-wrap gap-2">
                                                {[...POPULAR_SPORTS, 'Others'].map((sport) => {
                                                    const on = form.sports.includes(sport);
                                                    return (
                                                        <button
                                                            key={sport}
                                                            type="button"
                                                            onClick={() => { toggleSport(sport); clearError('eligibility'); }}
                                                            className={`px-3 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5 transition-all ${on
                                                                ? 'bg-[#093fb4] text-white border-[#093fb4]'
                                                                : 'bg-white text-black/60 border-black/20 hover:border-[#093fb4]/60'
                                                                }`}
                                                        >
                                                            {sport} {on ? <X size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {form.sports.includes('Others') && (
                                                <input
                                                    type="text"
                                                    placeholder="Enter other sports..."
                                                    className={`${inputCls} mt-2`}
                                                    value={form.other_sport}
                                                    onChange={e => setForm(prev => ({ ...prev, other_sport: e.target.value }))}
                                                />
                                            )}
                                        </Field>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Indigenous Person" isEditing={editMode.eligibility} displayValue={form.is_indigenous}>
                                            <YesNo value={form.is_indigenous} disabled={!editMode.eligibility}
                                                onChange={(v) => { setForm(prev => ({ ...prev, is_indigenous: v, indigenous_group: v === 'No' ? '' : prev.indigenous_group })); clearError('eligibility'); }} />
                                        </Field>
                                        <Field label="Person with Disability (PWD)" isEditing={editMode.eligibility} displayValue={form.is_pwd}>
                                            <YesNo value={form.is_pwd} disabled={!editMode.eligibility}
                                                onChange={(v) => { setForm(prev => ({ ...prev, is_pwd: v })); clearError('eligibility'); }} />
                                        </Field>
                                        <Field label="Working Student" isEditing={editMode.eligibility} displayValue={form.is_working_student}>
                                            <YesNo value={form.is_working_student} disabled={!editMode.eligibility}
                                                onChange={(v) => { setForm(prev => ({ ...prev, is_working_student: v })); clearError('eligibility'); }} />
                                        </Field>
                                        <Field label="Poverty Reduction Program" isEditing={editMode.eligibility} displayValue={form.is_poverty_program}>
                                            <YesNo value={form.is_poverty_program} disabled={!editMode.eligibility}
                                                onChange={(v) => { setForm(prev => ({ ...prev, is_poverty_program: v, program_type: '', other_program: '' })); clearError('eligibility'); }} />
                                        </Field>
                                    </div>

                                    {form.is_indigenous === 'Yes' && (
                                        <Field label="Indigenous Group / Tribe" isEditing={editMode.eligibility} displayValue={form.indigenous_group}>
                                            <input
                                                type="text"
                                                placeholder="Enter your indigenous group..."
                                                className={inputCls}
                                                value={form.indigenous_group}
                                                onChange={e => setForm(prev => ({ ...prev, indigenous_group: e.target.value }))}
                                            />
                                        </Field>
                                    )}

                                    {form.is_poverty_program === 'Yes' && (
                                        <Field label="Program Type" isEditing={editMode.eligibility} displayValue={form.program_type === 'Others' ? form.other_program : form.program_type}>
                                            <select
                                                className={inputCls}
                                                value={form.program_type}
                                                onChange={e => setForm(prev => ({ ...prev, program_type: e.target.value, other_program: '' }))}
                                            >
                                                <option value="">Select program</option>
                                                {PROGRAM_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            {form.program_type === 'Others' && (
                                                <input
                                                    type="text"
                                                    placeholder="Specify the program..."
                                                    className={`${inputCls} mt-2`}
                                                    value={form.other_program}
                                                    onChange={e => setForm(prev => ({ ...prev, other_program: e.target.value }))}
                                                />
                                            )}
                                        </Field>
                                    )}

                                    {fieldErrors.eligibility && (
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-wider ml-1">{fieldErrors.eligibility}</p>
                                    )}
                                </div>
                            </div>

                            {/* ================= 3. PERSONAL ================= */}
                            <div
                                ref={sectionRefs.personal}
                                className={`transition-all duration-300 rounded-3xl relative ${activeTourSection === 'personal' ? 'border-2 border-[#093fb4] ring-4 ring-[#093fb4]/30 shadow-xl p-4 bg-blue-50/10' : ''}`}
                            >
                                {activeTourSection === 'personal' && (
                                    <div className="absolute -top-10 left-4 z-20 bg-[#093fb4] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2">
                                        <span>Editing Personal Details...</span>
                                    </div>
                                )}
                                <SectionTitle
                                    icon={User}
                                    title="Personal Details"
                                    description="Contact, address, and demographic data"
                                />
                                <div className="space-y-4 mb-7 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <ContactField
                                            label="Contact Number"
                                            value={form.scontact_number}
                                            onChange={e => handleContactChange('scontact_number', e)}
                                            error={fieldErrors.scontact_number}
                                            isEditing={editMode.personal}
                                        />
                                        <Field label="Gender" isEditing={editMode.personal} displayValue={form.sgender}>
                                            <select
                                                className={inputCls}
                                                value={form.sgender}
                                                onChange={e => setForm(prev => ({ ...prev, sgender: e.target.value }))}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </Field>

                                        <Field label="Religion" isEditing={editMode.personal} displayValue={getReligionDisplayName()}>
                                            <select
                                                className={inputCls}
                                                value={form.religion}
                                                onChange={e => setForm(prev => ({ ...prev, religion: e.target.value, other_religion: e.target.value === 'Others' ? prev.other_religion : '' }))}
                                            >
                                                <option value="">Select Religion</option>
                                                <option value="Roman Catholic">Roman Catholic</option>
                                                <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                                                <option value="Muslim">Muslim</option>
                                                <option value="Christian">Christian</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </Field>
                                        {form.religion === 'Others' && (
                                            <Field label="Specify Religion" isEditing={editMode.personal} displayValue={form.other_religion}>
                                                <input
                                                    type="text"
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
                                        <Field label="District" isEditing={editMode.personal} displayValue={form.sdistrict}>
                                            <select
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
                                        <Field label="Barangay" isEditing={editMode.personal} displayValue={form.sbarangay}>
                                            <select
                                                className={inputCls}
                                                value={form.sbarangay}
                                                onChange={e => setForm(prev => ({ ...prev, sbarangay: e.target.value }))}
                                            >
                                                <option value="">Select Barangay</option>
                                                {currentBarangayMissing && <option value={form.sbarangay}>{form.sbarangay}</option>}
                                                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="House No. & Street" isEditing={editMode.personal} displayValue={form.sstreet}>
                                            <input
                                                type="text"
                                                placeholder="House No., Street name"
                                                className={inputCls}
                                                value={form.sstreet}
                                                onChange={e => setForm(prev => ({ ...prev, sstreet: e.target.value }))}
                                            />
                                        </Field>
                                        <Field label="Postal Code" isEditing={editMode.personal} displayValue={form.szip_code}>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
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
                            </div>

                            {/* ================= 4. FAMILY ================= */}
                            <div
                                ref={sectionRefs.family}
                                className={`transition-all duration-300 rounded-3xl relative ${activeTourSection === 'family' ? 'border-2 border-[#093fb4] ring-4 ring-[#093fb4]/30 shadow-xl p-4 bg-blue-50/10' : ''}`}
                            >
                                {activeTourSection === 'family' && (
                                    <div className="absolute -top-10 left-4 z-20 bg-[#093fb4] text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2">
                                        <span>Editing Family Information...</span>
                                    </div>
                                )}
                                <SectionTitle
                                    icon={Users}
                                    title="Family Information"
                                    description="Parents and guardian details"
                                />
                                <div className="space-y-5 mb-4 pt-2">
                                    {[
                                        { key: 'mother', title: "Mother's Details", occLabel: 'Occupation' },
                                        { key: 'father', title: "Father's Details", occLabel: 'Occupation' },
                                        { key: 'guardian', title: 'Guardian Details', occLabel: 'Relationship / Occupation' }
                                    ].map(({ key, title, occLabel }) => (
                                        <div key={key}>
                                            <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.18em] mb-2.5">{title}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="sm:col-span-2">
                                                    <Field label="Full Name" isEditing={editMode.family} displayValue={form[`${key}_name`]}>
                                                        <input
                                                            type="text"
                                                            placeholder="Full Name"
                                                            className={inputCls}
                                                            value={form[`${key}_name`]}
                                                            onChange={e => setForm(prev => ({ ...prev, [`${key}_name`]: e.target.value }))}
                                                        />
                                                    </Field>
                                                </div>
                                                <ContactField
                                                    label="Contact Number"
                                                    value={form[`${key}_contact`]}
                                                    onChange={e => handleContactChange(`${key}_contact`, e)}
                                                    error={fieldErrors[`${key}_contact`]}
                                                    isEditing={editMode.family}
                                                />
                                                <Field label={occLabel} isEditing={editMode.family} displayValue={form[`${key}_occupation`]}>
                                                    <input
                                                        type="text"
                                                        placeholder={occLabel}
                                                        className={inputCls}
                                                        value={form[`${key}_occupation`]}
                                                        onChange={e => setForm(prev => ({ ...prev, [`${key}_occupation`]: e.target.value }))}
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    ))}

                                    <Field label="Family Household Address" isEditing={editMode.family} displayValue={form.house_address}>
                                        <textarea
                                            placeholder="Enter complete family residential home address..."
                                            className={`${inputCls} resize-none min-h-[84px]`}
                                            value={form.house_address}
                                            onChange={e => setForm(prev => ({ ...prev, house_address: e.target.value }))}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* ================= SUBMIT SECTION ================= */}
                        <div
                            ref={submitRef}
                            className={`px-8 md:px-12 py-6 border-t-2 border-black/5 bg-gray-50 shrink-0 transition-all duration-300 rounded-b-[2.5rem] relative ${activeTourSection === 'submit' ? 'border-2 border-[#093fb4] ring-4 ring-[#093fb4]/30 shadow-2xl bg-blue-50/20' : ''}`}
                        >
                            {activeTourSection === 'submit' && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 bg-[#093fb4] text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
                                    <span>click submit when finished</span>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={saving || (!hasEdited && activeTourSection !== 'submit') || (isTourRunning && activeTourSection !== 'submit')}
                                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 border-2 ${hasEdited || activeTourSection === 'submit'
                                        ? 'bg-[#093fb4] hover:bg-[#073496] text-white border-transparent shadow-lg shadow-[#093fb4]/25 active:scale-95 cursor-pointer'
                                        : 'bg-black/10 text-black/40 cursor-not-allowed border-transparent'
                                        }`}
                                >
                                    {saving ? <><Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> Saving Updates...</> : 'Save Profile Changes'}
                                </button>
                            </div>
                            {!hasEdited && activeTourSection !== 'submit' && !isTourRunning && (
                                <p className="text-center text-[10px] font-black text-black/40 uppercase tracking-widest mt-3">
                                    Click 'Edit Profile' above to make changes
                                </p>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
