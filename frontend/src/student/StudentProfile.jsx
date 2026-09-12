import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { Camera, User, MapPin, Plus, Award, FileText, GraduationCap, School, Edit2, ExternalLink, Users } from 'lucide-react';
import api from '../api';
import AddPortfolioModal from './AddPortfolioModal'; 
import StudentEditProfile from './StudentEditProfile';

const backendURL = "http://localhost:5000";

function ProfileInfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-black/5 last:border-0 text-sm">
      <span className="text-slate-500 font-black uppercase tracking-wider text-[10px]">{label}</span>
      <span className="text-slate-900 font-bold truncate max-w-[300px] text-right">{value || '—'}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-2 border-b border-black/5">
      <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 flex items-center justify-center text-[#093fb4]">
        <Icon size={18} stroke={2.5} />
      </div>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">{title}</h3>
    </div>
  );
}

export default function StudentProfile() {
  const location = useLocation();
  const { student, loading, refreshProfile } = useStudent();
 
  const [editTab, setEditTab] = useState(null); 
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(location.state?.justOnboarded || false);
  
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profile_image', file);
    try {
      await api.put(`/upload-profile/me`, formData);
      refreshProfile(); 
      window.dispatchEvent(new Event('profilePicUpdated'));
    } catch (err) {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="text-center py-12 text-slate-400 font-black text-sm uppercase tracking-widest">
      Student record unverified or missing.
    </div>
  );

  let processedPortfolio = [];
  try {
    if (student.portfolio_data) {
      processedPortfolio = typeof student.portfolio_data === 'string' 
        ? JSON.parse(student.portfolio_data) 
        : student.portfolio_data;
    }
  } catch (e) {}

  const schoolName = student?.other_school ? student.other_school : (student?.college_name || "School not set");
  const degreeName = student?.other_degree_program ? student.other_degree_program : (student?.course_name || "Course not set");
  const fullAddress = [student?.sbarangay, student?.sdistrict, student?.sstreet, student?.szip_code].filter(Boolean).join(', ') || "Not provided";

  const hasMother = !!student?.mother_name;
  const hasFather = !!student?.father_name;
  const hasGuardian = !!student?.guardian_name;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 text-slate-800 font-['Inter'] antialiased">
      
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-xl max-w-md w-full rounded-[2.5rem] border border-white/60 p-10 shadow-2xl transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center justify-center text-[#093fb4]">
                <GraduationCap size={48} stroke={2} />
              </div>
            </div>
            <h3 className="text-center text-sm font-black uppercase tracking-[0.2em] text-slate-900 mb-4">
              Account Setup
            </h3>
            <p className="text-slate-600 text-sm font-medium text-center leading-relaxed px-2 mb-8">
              Setting up your account for academic, professional, and scholarship criteria right now will significantly <span className="text-black font-black uppercase tracking-wider text-xs ml-1">increase your chances</span> of matching and receiving the perfect scholarship grant!
            </p>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full bg-[#093fb4] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[#073496] transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98]"
            >
              Let's Complete Profile
            </button>
          </div>
        </div>
      )}

      {/* ================= UNIFIED PROFILE CONTAINER ================= */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8 relative overflow-hidden">
        
        {/* TOP BIO OVERVIEW */}
        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center pb-6 border-b border-black/5">
          <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
            <div className="w-36 h-36 rounded-[2rem] bg-white/60 border-4 border-white/80 overflow-hidden flex items-center justify-center shadow-lg transition-transform group-hover:scale-[1.02]">
              {student.sprofile_pic ? (
                <img src={student.sprofile_pic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={64} className="text-slate-300" stroke={1.5} />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <Camera size={28} className="text-white" stroke={2.5}/>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
          </div>

          <div className="space-y-4 flex-1 w-full min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between w-full gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">
                  {student.sfirst_name} {student.slast_name}
                </h1>
                <p className="text-[#093fb4] text-sm font-black uppercase tracking-[0.2em] mt-2">
                  {degreeName}
                </p>
              </div>
              <button 
                onClick={() => setEditTab('academic')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-slate-700 bg-white/60 border-2 border-white/80 rounded-2xl hover:bg-white hover:text-[#093fb4] hover:border-[#093fb4]/40 transition-all shadow-sm active:scale-95"
              >
                <Edit2 size={16} stroke={2.5}/> Edit Profile
              </button>
            </div>

            {student.bio && (
              <p className="text-sm text-slate-700 font-semibold leading-relaxed max-w-2xl bg-white/50 p-4 rounded-2xl border-2 border-white/80 italic shadow-sm">
                "{student.bio}"
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/60 border-2 border-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <GraduationCap size={16} className="text-[#093fb4]" stroke={2.5}/>
                <span>ID: <strong className="text-slate-900 ml-1">{student.student_id || '—'}</strong></span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/60 border-2 border-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <School size={16} className="text-[#093fb4]" stroke={2.5}/>
                <span>Level: <strong className="text-slate-900 ml-1">{student.year_level || '—'}</strong></span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/60 border-2 border-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <Award size={16} className="text-[#093fb4]" stroke={2.5}/>
                <span>GWA: <strong className="text-slate-900 ml-1">{student.gwa ? Number(student.gwa).toFixed(2) : '—'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: ACADEMIC INFO */}
        <div className="space-y-4">
          <SectionHeader icon={School} title="Academic Information" />
          <div className="bg-white/60 border-2 border-white/80 rounded-2xl p-6 shadow-sm">
            <ProfileInfoRow label="Campus / Institution" value={schoolName} />
            <ProfileInfoRow label="Degree Track" value={degreeName} />
          </div>
        </div>

        {/* SECTION 2: PERSONAL DETAILS */}
        <div className="space-y-4">
          <SectionHeader icon={User} title="Personal Details" />
          <div className="bg-white/60 border-2 border-white/80 rounded-2xl p-6 shadow-sm">
            <ProfileInfoRow label="Email Address" value={student.student_email} />
            <ProfileInfoRow label="Contact Number" value={student.scontact_number ? `+63 ${student.scontact_number}` : '—'} />
            <ProfileInfoRow label="Gender Profile" value={student.sgender} />
            <ProfileInfoRow label="Religion" value={student.religion === 'Others' ? student.other_religion : student.religion} />
          </div>
        </div>

        {/* SECTION 3: PERMANENT RESIDENCE */}
        <div className="space-y-4">
          <SectionHeader icon={MapPin} title="Permanent Residence" />
          <div className="p-6 bg-white/60 border-2 border-white/80 rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              {fullAddress || "No complete family address listed. Kindly update via family settings."}
            </p>
          </div>
        </div>

        {/* SECTION 4: FAMILY INFORMATION */}
        <div className="space-y-4">
          <SectionHeader icon={Users} title="Family Information" />
          <div className="bg-white/60 border-2 border-white/80 rounded-2xl p-6 shadow-sm space-y-6">
            {hasMother && (
              <div>
                <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-3">Mother's Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ProfileInfoRow label="Full Name" value={student.mother_name} />
                  <ProfileInfoRow label="Contact Number" value={student.mother_contact} />
                  <ProfileInfoRow label="Occupation" value={student.mother_occupation} />
                </div>
              </div>
            )}

            {hasFather && (
              <div className={hasMother ? "pt-4 border-t border-black/5" : ""}>
                <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-3">Father's Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ProfileInfoRow label="Full Name" value={student.father_name} />
                  <ProfileInfoRow label="Contact Number" value={student.father_contact} />
                  <ProfileInfoRow label="Occupation" value={student.father_occupation} />
                </div>
              </div>
            )}

            {hasGuardian && (
              <div className={(hasMother || hasFather) ? "pt-4 border-t border-black/5" : ""}>
                <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-3">Guardian Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ProfileInfoRow label="Guardian Name" value={student.guardian_name} />
                  <ProfileInfoRow label="Contact Number" value={student.guardian_contact} />
                  <ProfileInfoRow label="Occupation" value={student.guardian_occupation} />
                </div>
              </div>
            )}

            {!hasMother && !hasFather && !hasGuardian && (
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center py-4">No family information provided yet.</p>
            )}

            {student?.house_address && (
              <div className="pt-4 border-t border-black/5">
                <ProfileInfoRow label="Family House Address" value={student.house_address} />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: PORTFOLIO & ACHIEVEMENTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-6 pb-2 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 flex items-center justify-center text-[#093fb4]">
                <Award size={18} stroke={2.5} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Portfolio & Documents</h3>
            </div>
            <button 
              onClick={() => setIsPortfolioModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[#093fb4] rounded-xl hover:bg-[#073496] transition-all shadow-md active:scale-95"
            >
              <Plus size={16} stroke={3} /> Add Document
            </button>
          </div>

          {Array.isArray(processedPortfolio) && processedPortfolio.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {processedPortfolio.map((item, idx) => {
                if (!item) return null;
                const itemTitle = typeof item === 'object' ? item.title : item;
                let rawLink = typeof item === 'object' ? (item.link || item.url || item.href) : null;
                
                if (rawLink && typeof rawLink === 'string') {
                  rawLink = rawLink.trim().replace(/\\/g, '/');
                  if (rawLink.startsWith('uploads/')) rawLink = `${backendURL}/${rawLink}`;
                }

                return (
                  <a
                    key={idx}
                    href={rawLink || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 px-5 py-4 bg-white/60 border-2 border-white/80 hover:border-[#093fb4]/50 hover:bg-white rounded-2xl shadow-sm transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-[#093fb4]" stroke={2.5}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-wider truncate group-hover:text-[#093fb4] transition-colors">
                        {itemTitle}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold tracking-widest uppercase">Digital Copy</p>
                    </div>
                    <ExternalLink size={18} className="text-slate-300 group-hover:text-[#093fb4] shrink-0 ml-1 transition-colors" stroke={2.5} />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-white/40 border-2 border-dashed border-white/80 rounded-[2rem] text-center">
              <FileText size={32} className="text-slate-300 mb-3" stroke={1.5}/>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No verified extra portfolio files uploaded yet.</p>
            </div>
          )}
        </div>

      </div>

      {editTab && (
        <StudentEditProfile
          initialTab={editTab}
          studentData={student}
          onClose={() => setEditTab(null)}
          onRefresh={refreshProfile}
        />
      )}
      {isPortfolioModalOpen && (
        <AddPortfolioModal onClose={() => { setIsPortfolioModalOpen(false); refreshProfile(); }} studentData={student} />
      )}
    </div>
  );
}