import { useState, useEffect } from 'react';
import api from '../api';
import { User, School, GraduationCap, Edit3, Save, X, Mail, FileText, MapPin } from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const studentId = localStorage.getItem('studentId');
        const res = await api.get(`/students/${studentId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Error retrieving profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Helper to extract Barangay from the full address string
  const getAddressPart = (part) => {
    if (!profile?.saddress) return "Not Set";
    const parts = profile.saddress.split(',');
    if (part === 'barangay') return parts[0]?.trim() || "Not Set";
    if (part === 'city') return parts[1]?.trim() || "Not Set";
    return profile.saddress;
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const studentId = localStorage.getItem('studentId');
      await api.put(`/update-profile/${studentId}`, profile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeOptions = () => {
    switch(profile?.academic_category) {
        case 'Elementary': return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
        case 'Junior High': return ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
        case 'Senior High': return ['Grade 11', 'Grade 12'];
        case 'Tertiary': return ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year+'];
        default: return [];
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">RETRIEVING PROFILE...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER CARD */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Profile Picture Logic */}
              <div className="h-32 w-32 bg-blue-600 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 flex items-center justify-center text-4xl font-black">
                {profile.sprofile_pic ? (
                  <img 
                    src={`${BASE_URL}/${profile.sprofile_pic.replace(/\\/g, '/')}`} 
                    className="w-full h-full object-cover" 
                    alt="Profile" 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${profile.sfirst_name}&background=0D8ABC&color=fff`; }}
                  />
                ) : (
                  <span>{profile.sfirst_name?.[0]}{profile.slast_name?.[0]}</span>
                )}
              </div>
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-4xl font-black tracking-tight">{profile.sfirst_name} {profile.slast_name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                   <p className="flex items-center gap-2 text-slate-400 bg-white/5 px-4 py-2 rounded-xl text-sm"><Mail size={14}/> {profile.student_email}</p>
                   <p className="flex items-center gap-2 text-slate-400 bg-white/5 px-4 py-2 rounded-xl text-sm"><MapPin size={14}/> {getAddressPart('barangay')}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`${isEditing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg`}
            >
              {isEditing ? <><X size={18} /> Cancel</> : <><Edit3 size={18} /> Edit Profile</>}
            </button>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-12 space-y-12">
          
          {/* PERSONAL INFO */}
          <section className="space-y-8">
            <SectionHeader icon={<User size={20}/>} title="Personal Details" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <InfoBlock label="Birth Date" value={profile.sbirth_date || "N/A"} />
              <InfoBlock label="Gender" value={profile.sgender || "N/A"} />
              <InfoBlock label="Contact" value={profile.scontact_number || "N/A"} />
              <InfoBlock label="Status" value={profile.sstatus} statusMode />
              <div className="col-span-2 md:col-span-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Residential Address</p>
                <p className="font-bold text-slate-700">{profile.saddress || "No address provided"}</p>
              </div>
            </div>
          </section>

          {/* ACADEMIC INFO */}
          <section className="space-y-8 border-t pt-12">
            <SectionHeader icon={<GraduationCap size={20}/>} title="Academic Standing" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Current Institution</label>
                {isEditing ? (
                  <input name="school_name" value={profile.school_name || ''} onChange={handleChange} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-500 outline-none transition-all" />
                ) : (
                  <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-700">{profile.school_name || "Not Specified"}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Education Level</label>
                {isEditing ? (
                  <select name="academic_category" value={profile.academic_category} onChange={handleChange} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none">
                    <option value="Elementary">Elementary</option>
                    <option value="Junior High">Junior High</option>
                    <option value="Senior High">Senior High</option>
                    <option value="Tertiary">Tertiary</option>
                  </select>
                ) : (
                  <div className="p-5 bg-blue-50 text-blue-700 rounded-2xl font-black">{profile.academic_category}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Grade / Year Level</label>
                {isEditing ? (
                  <select name="grade_level" value={profile.grade_level} onChange={handleChange} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none">
                    {getGradeOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-700">{profile.grade_level}</div>
                )}
              </div>

              {/* GWA - Only visible if NOT Elementary */}
{profile.academic_category !== 'Elementary' && profile.academic_category !== 'Junior High' && (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
      General Weighted Average (GWA)
    </label>
    <div className="p-5 bg-green-50 text-green-700 rounded-2xl font-black text-xl">
      {profile.gwa || "0.00"}
    </div>
  </div>
)}
            </div>
          </section>

          {/* DOCUMENTS */}
          {/* DOCUMENTS SECTION - NOW CONDITIONAL */}
          <section className="space-y-8 border-t pt-12">
            <SectionHeader icon={<FileText size={20}/>} title="Verification Documents" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Logic for Tertiary vs Others */}
              {profile.academic_category === 'Tertiary' ? (
                <>
                  {/* TERTIARY VIEW */}
                
                  <DocumentCard 
                    label="School ID / Student ID" 
                    path={profile.sid_card_path} // Reusing the slot for GWA
                    baseUrl={BASE_URL} 
                  />
                  <DocumentCard 
                    label="TOR/ Grade Slip" 
                    path={profile.sdocument_path} 
                    baseUrl={BASE_URL} 
                  />
                </>
              ) : (
                <>
                  {/* ELEMENTARY / HS VIEW */}
                  <DocumentCard 
                    label="School ID / Student ID" 
                    path={profile.sid_card_path} 
                    baseUrl={BASE_URL} 
                  />
                  <DocumentCard 
                    label="Report Card " 
                    path={profile.report_card_path} 
                    baseUrl={BASE_URL} 
                  />
                  <DocumentCard 
                    label="Good Moral Certificate" 
                    path={profile.good_moral_path} 
                    baseUrl={BASE_URL} 
                  />
                  
                </>
              )}
            </div>
          </section>

          {isEditing && (
            <div className="flex justify-end pt-8">
              <button onClick={handleUpdate} disabled={isSaving} className="bg-slate-900 hover:bg-blue-600 text-white px-12 py-5 rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3">
                {isSaving ? "PROCESSING..." : <><Save size={20}/> SAVE ALL CHANGES</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
      <h3 className="font-black text-sm tracking-[0.2em] uppercase text-slate-800">{title}</h3>
    </div>
  );
}

function InfoBlock({ label, value, statusMode = false }) {
  const getStatusColor = (val) => {
    if (val?.toLowerCase() === 'approved') return 'text-green-600';
    if (val?.toLowerCase() === 'pending') return 'text-orange-500';
    if (val?.toLowerCase() === 'rejected') return 'text-red-500';
    return 'text-slate-800';
  };

  return (
    <div className="space-y-1 px-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-bold ${statusMode ? getStatusColor(value) : 'text-slate-700'}`}>
        {value || "---"}
      </p>
    </div>
  );
}

function DocumentCard({ label, path, baseUrl }) {
  const isAvailable = !!path;
  return (
    <div className={`p-6 rounded-3xl border-2 transition-all ${isAvailable ? 'bg-white border-slate-100 hover:border-blue-500 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{label}</p>
      {isAvailable ? (
        <a href={`${baseUrl}/${path.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-blue-600 font-black text-sm group">
          VIEW FILE <FileText size={18} className="group-hover:translate-x-1 transition-transform" />
        </a>
      ) : (
        <span className="text-xs font-bold text-slate-400">MISSING DOCUMENT</span>
      )}
    </div>
  );
}