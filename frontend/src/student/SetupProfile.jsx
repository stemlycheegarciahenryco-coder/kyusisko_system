import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { User, GraduationCap, FileText, School, MapPin, Camera } from 'lucide-react';
import Swal from 'sweetalert2'
export default function SetupProfile() {
  const [profile, setProfile] = useState({
    grade_level: '',
    school_year: '2025-2026',
    term: '',
    school_name: '',
    region: '',
    city: '',
    barangay: '',
    regionCode: '',
    cityCode: '',
    academic_category: ''
  });

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch Profile Data & Initial Regions
  useEffect(() => {
    const initLoad = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        
        // Parallel fetch for speed
        const [profileRes, regionsRes] = await Promise.all([
          api.get(`/students/${studentId}`),
          fetch('https://psgc.gitlab.io/api/regions/').then(r => r.json())
        ]);

        const data = profileRes.data;
        setRegions(regionsRes);

        // MAP DATA PROPERLY: This is why it wasn't showing before
        setProfile(prev => ({
          ...prev,
          ...data,
          // If backend returns school_name but frontend state had it empty, it fills now
        }));

        // Set image preview if profile pic exists
        if (data.sprofile_pic) {
          // Assuming your backend serves uploads via /uploads path
          setImagePreview(`http://localhost:5000/${data.sprofile_pic}`);
        }

      } catch (err) {
        console.error("Error loading initial data", err);
      } finally {
        setLoading(false);
      }
    };
    initLoad();
  }, []);

  // 2. Fetch Cities when Region changes
  useEffect(() => {
    if (profile.regionCode) {
      fetch(`https://psgc.gitlab.io/api/regions/${profile.regionCode}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error("City fetch error", err));
    }
  }, [profile.regionCode]);

  // 3. Fetch Barangays when City changes
  useEffect(() => {
    if (profile.cityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${profile.cityCode}/barangays/`)
        .then(res => res.json())
        .then(data => setBarangays(data))
        .catch(err => console.error("Barangay fetch error", err));
    }
  }, [profile.cityCode]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddressChange = (e) => {
  const { name, value } = e.target;
  if (name === "region") {
    // Note: PSGC API sometimes uses 'name' and sometimes 'regionName'
    const selected = regions.find(r => r.name === value || r.regionName === value);
    setProfile(prev => ({ 
      ...prev, 
      region: value, 
      regionCode: selected?.code || '', 
      city: '', cityCode: '', barangay: '' 
    }));
  } else if (name === "city") {
    const selected = cities.find(c => c.name === value);
    setProfile(prev => ({ 
      ...prev, 
      city: value, // This ensures !profile.city becomes true
      cityCode: selected?.code || '', 
      barangay: '' 
    }));
  }
};

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Simplified Validation (Removed academic_category)
  const isFormIncomplete = !profile.grade_level || !profile.term || !profile.school_name || !profile.city;

  const handleSaveAndProceed = async () => {
  setIsSaving(true);
  const studentId = localStorage.getItem('studentId');
  const fullAddress = `${profile.barangay}, ${profile.city}, ${profile.region}`;
  
  const formData = new FormData();
  formData.append('grade_level', profile.grade_level);
  formData.append('school_name', profile.school_name);
  formData.append('term', profile.term);
  formData.append('school_year', profile.school_year);
  formData.append('saddress', fullAddress);
  
  if (profilePic) {
    formData.append('profile_image', profilePic);
  }

  try {
    await api.put(`/update-profile/${studentId}`, formData);

    // --- SUCCESS DIALOG ---
    await Swal.fire({
      title: `<span style="font-family: 'Inter', sans-serif; font-weight: 900; text-transform: uppercase; italic;">Welcome to Kyus<span style="color: #2563eb;">ISKO</span>!</span>`,
      html: `
        <div style="padding: 10px;">
          <p style="color: #64748b; font-weight: 600; font-size: 14px;">
            Hi <b>${profile.sfirst_name}</b>, your profile has been successfully setup. 
            You can now explore and apply for available scholarships.
          </p>
        </div>
      `,
      icon: 'success',
      iconColor: '#2563eb',
      confirmButtonText: 'START EXPLORING',
      confirmButtonColor: '#0f172a',
      padding: '2rem',
      buttonsStyling: true,
      customClass: {
        popup: 'rounded-[2.5rem]',
        confirmButton: 'rounded-2xl px-8 py-3 font-black text-xs tracking-widest uppercase'
      }
    });

    navigate('/scholarships');
  } catch (err) {
    console.error(err);
    Swal.fire({
      title: 'Setup Failed',
      text: 'We couldn\'t save your details. Please check your connection.',
      icon: 'error',
      confirmButtonColor: '#dc2626'
    });
  } finally {
    setIsSaving(false);
  }
};


  const getGradeLevelOptions = () => {
  const category = profile.academic_category?.toLowerCase() || "";

  if (category.includes("elementary")) {
    return ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
  } 
  
  if (category.includes("junior") || category.includes("high school")) {
    return ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
  }

  if (category.includes("senior")) {
    return ["Grade 11", "Grade 12"];
  }

  if (category.includes("tertiary") || category.includes("college")) {
    return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  }

  return [];
};
  const category = profile.academic_category ? profile.academic_category.trim() : "";
const isHigherEd = category === "Senior High" || category === "Tertiary";



const getSchoolYears = () => {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 6 }, (_, i) => {
    const start = currentYear + i;
    return `${start}-${start + 1}`;
  });
};

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-400 font-bold">LOADING PROFILE...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl"><GraduationCap size={40} /></div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black tracking-tight">Academic Verification</h2>
            <p className="text-blue-100 text-sm mt-1">Provide your details to unlock scholarships.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-8">
          
          {/* Profile Pic Section */}
          <section className="flex flex-col items-center py-2">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User size={40} className="text-slate-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer shadow-md">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </section>

          {/* Identity Section */}
<section className="space-y-4">
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
    <User size={18} className="text-blue-600" />
    <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Identity</h3>
  </div>


  <div className={`grid gap-4 ${
    (profile.academic_category?.includes('Senior') || profile.academic_category?.includes('Tertiary')) 
    ? 'grid-cols-2' 
    : 'grid-cols-1'
  }`}>
    
    <div className="p-4 bg-slate-50 rounded-2xl">
      <p className="text-[10px] text-slate-400 font-bold uppercase">Student Name</p>
      <p className="font-bold text-slate-700">{profile.sfirst_name} {profile.slast_name}</p>
    </div>

    {/* This will now only appear if isHigherEd is true */}
    {isHigherEd && (
      <div className="p-4 bg-white border-2 border-blue-100 rounded-2xl">
        <p className="text-[10px] text-blue-600 font-black uppercase">Current GWA</p>
        <p className="font-black text-slate-800 text-xl">{profile.gwa || '0.00'}</p>
      </div>
    )}
  </div>
</section>

          {/* School Name */}
          <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <School size={18} className="text-blue-600" />
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Current School</h3>
              </div>
              <input 
                type="text" 
                name="school_name"
                value={profile.school_name || ''} 
                onChange={handleChange}
                placeholder="Enter Full School Name"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition-all"
              />
          </section>

          {/* Address Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <MapPin size={18} className="text-blue-600" />
              <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Location</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select name="region" value={profile.region || ''} onChange={handleAddressChange} className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border-2 border-transparent focus:border-blue-500">
                <option value="">Region</option>
                {regions.map(r => <option key={r.code} value={r.name}>{r.regionName || r.name}</option>)}
              </select>
              <select name="city" value={profile.city || ''} onChange={handleAddressChange} disabled={!profile.regionCode} className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border-2 border-transparent focus:border-blue-500 disabled:opacity-50">
                <option value="">City</option>
                {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
              <select name="barangay" value={profile.barangay || ''} onChange={handleChange} disabled={!profile.cityCode} className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border-2 border-transparent focus:border-blue-500 disabled:opacity-50">
                <option value="">Barangay</option>
                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </section>

          {/* Academic Status */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <FileText size={18} className="text-blue-600" />
              <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Academic Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SEMESTER / TERM DROPDOWN */}
<div className="space-y-1">
  <label className="text-[10px] font-black text-slate-400 ml-2">
    {profile.academic_category === 'Tertiary' ? 'SEMESTER' : 'GRADING PERIOD'}
  </label>
  <select name="term" value={profile.term || ''} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-2 border-transparent focus:border-blue-500 outline-none">
    <option value="">Select Option</option>
    {profile.academic_category === 'Tertiary' || profile.academic_category === 'Senior High' ? (
      <>
        <option value="1st Semester">1st Semester</option>
        <option value="2nd Semester">2nd Semester</option>
      </>
    ) : (
      <>
        <option value="1st Quarter">1st Quarter</option>
        <option value="2nd Quarter">2nd Quarter</option>
        <option value="3rd Quarter">3rd Quarter</option>
        <option value="4th Quarter">4th Quarter</option>
      </>
    )}
  </select>
</div>  
<div className="space-y-1">
  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">
    Grade / Year Level
  </label>
  <select 
    name="grade_level" 
    value={profile.grade_level || ''} 
    onChange={handleChange} 
    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-2 border-transparent focus:border-blue-500 outline-none transition-all"
  >
    <option value="">Select Level</option>
    {getGradeLevelOptions().map((level) => (
      <option key={level} value={level}>
        {level}
      </option>
    ))}
  </select>
</div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-2">SCHOOL YEAR</label>
                <select name="school_year" value={profile.school_year || ''} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-2 border-transparent focus:border-blue-500 outline-none">
                  {getSchoolYears().map((year) => (
  <option key={year} value={year}>
    {year}
  </option>
))}
                  
                </select>
              </div>
            </div>
          </section>

          <button
            onClick={handleSaveAndProceed}
            disabled={isSaving || isFormIncomplete || !profilePic}
            className={`w-full font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 
              ${isFormIncomplete || !profilePic ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 hover:bg-blue-600 text-white shadow-xl shadow-blue-100'}`}
          >
            {isSaving ? "SAVING..." : "CONFIRM & PROCEED"}
          </button>
        </div>
      </div>
    </div>
  );
}