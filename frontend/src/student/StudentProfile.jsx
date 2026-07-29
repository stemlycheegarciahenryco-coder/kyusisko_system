import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudent } from './StudentContext';
import { Camera, User, MapPin, Phone, Mail, Plus, Award, FileText, GraduationCap, School, Users, Calendar, Edit2, ExternalLink, ShieldAlert } from 'lucide-react';
import api from '../api';
import AddPortfolioModal from './AddPortfolioModal'; 
import StudentEditProfile from './StudentEditProfile';

const backendURL = "http://localhost:5000";

// --- Inline Utility Sub-components for Structural Uniformity ---
function ProfileInfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-black font-semibold">{label}</span>
      <span className="text-slate-600 font-semibold truncate max-w-[220px]">{value || '—'}</span>
    </div>
  );
}

export default function StudentProfile() {
  const location = useLocation();
  const { student, loading, refreshProfile } = useStudent();
 
  // Modal Triggers
  const [editTab, setEditTab] = useState(null); // null | 'academic' | 'personal' | 'family'
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  
  // State for onboarding overlay
  const [showWelcomeModal, setShowWelcomeModal] = useState(location.state?.justOnboarded || false);
  
  const fileInputRef = useRef(null);

  // Avatar Upload Handler
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      const id = localStorage.getItem('studentId');
      await api.put(`/upload-profile/${id}`, formData);
      refreshProfile(); 
      window.dispatchEvent(new Event('profilePicUpdated'));
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="text-center py-12 text-slate-400 font-bold text-sm uppercase tracking-wider">
      Student record unverified or missing.
    </div>
  );

  // Safe parsing for custom portfolio/achievements array data
  let processedPortfolio = [];
  try {
    if (student.portfolio_data) {
      processedPortfolio = typeof student.portfolio_data === 'string' 
        ? JSON.parse(student.portfolio_data) 
        : student.portfolio_data;
    }
  } catch (e) {
    console.error("Failed parsing achievements data", e);
  }

  // Primary Caretaker display selectors
  const parentName = student.guardian_name || student.father_name || student.mother_name || '—';
  const parentRelationship = student.guardian_name ? 'Guardian' : student.father_name ? 'Father' : student.mother_name ? 'Mother' : 'Parent';
  const parentContact = student.guardian_contact || student.father_contact || student.mother_contact || '—';
  const schoolName = student?.other_school ? student.other_school : (student?.college_name || "School not set");
  const degreeName = student?.other_degree_program ? student.other_degree_program : (student?.course_name || "Course not set");
  const fullAddress = [student?.sstreet, student?.sbarangay, student?.szip_code].filter(Boolean).join(', ') || "Not provided";

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800 antialiased relative">
      
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-black/5 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-[#093fb4]/10 rounded-2xl flex items-center justify-center text-[#093fb4]">
                <GraduationCap size={32} />
              </div>
            </div>
            <h3 className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#093fb4] mb-3">
              Account Setup
            </h3>
            <p className="text-slate-600 text-xs font-medium text-center leading-relaxed px-2 mb-6">
              Setting up your account for academic, professional, and scholarship criteria right now will significantly <span className="text-black font-bold">increase your chances</span> of matching and receiving the perfect scholarship grant!
            </p>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full bg-[#093fb4] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg shadow-[#093fb4]/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Let's Complete your Profile
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER BIO OVERVIEW CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          
          <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
            <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
              {student.sprofile_pic ? (
                <img src={student.sprofile_pic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={44} className="text-slate-300" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="space-y-1.5 flex-1 w-full min-w-0">
            <div className="flex items-start justify-between w-full">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {student.sfirst_name} {student.slast_name}
                </h1>
                <p className="text-[#093fb4] text-sm font-bold mt-0.5">
                  {degreeName}
                </p>
              </div>
              <button 
                onClick={() => setEditTab('academic')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-[#093fb4] bg-slate-50 border border-slate-200 rounded-lg hover:border-[#093fb4]/20 transition-all shadow-sm"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>

            {student.bio && (
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 italic">
                "{student.bio}"
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-600">
                <GraduationCap size={13} className="text-slate-400" />
                <span>Student ID: <strong className="text-slate-800">{student.student_id || '—'}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-600">
                <School size={13} className="text-slate-400" />
                <span>Year Level: <strong className="text-slate-800">{student.year_level || '—'}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-600">
    <Award size={13} className="text-[#093fb4]" />
    <span>GWA: <strong className="text-[#093fb4]">{student.gwa ? Number(student.gwa).toFixed(2) : '—'}</strong></span>
  </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SUB-SECTIONS GRID TRACK (Academic & Personal Info) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ACADEMIC PROFILE BLOCK */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
            <School size={14} className="text-[#093fb4]" />
            <span>Academic Information</span>
          </div>
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-0.5">
            <ProfileInfoRow label="Campus / Institution" value={schoolName} />
            <ProfileInfoRow label="Degree Track" value={degreeName} />
          </div>
        </div>

        {/* PERSONAL INFORMATION BLOCK */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#093fb4]" />
              <span>Personal Details</span>
            </div>
          </div>
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-0.5">
            <ProfileInfoRow label="Email Address" value={student.student_email} />
            <ProfileInfoRow label="Contact Number" value={student.scontact_number ? `+63 ${student.scontact_number}` : '—'} />
            <ProfileInfoRow label="Gender Profile" value={student.sgender} />
            <ProfileInfoRow label="Religious Affiliation" value={student.religion === 'Others' ? student.other_religion : student.religion} />
          </div>
        </div>

      </div>

      {/* 3. HOME ADDRESS BLOCK */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <MapPin size={14} className="text-[#093fb4]" />
          <span>Permanent Residence</span>
        </div>
        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
          <p className="text-sm font-semibold text-slate-700 leading-relaxed">
            {fullAddress || "No complete family address listed. Kindly update via family settings below."}
          </p>
        </div>
      </div>

      {/* 4. FAMILY / PARENT SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#093fb4]" />
            <span>Family Information</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-sm">
          <div>
            <p className="text-xs font-bold text-black uppercase tracking-wider mb-1">Guardian Name</p>
            <p className="font-semibold text-slate-600">{parentName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-black uppercase tracking-wider mb-1">Relationship</p>
            <p className="font-semibold text-slate-600">{parentRelationship}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-black uppercase tracking-wider mb-1">Contact Link</p>
            <p className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Phone size={14} className="text-slate-400" /> {parentContact}
            </p>
          </div>
        </div>
      </div>

      {/* 5. ACHIEVEMENTS & PORTFOLIO COMPONENT ROW */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-[#093fb4]" />
            <span>Achievements & Personal Portfolio Ledger</span>
          </div>
          <button 
            onClick={() => setIsPortfolioModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#093fb4] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={13} /> Add Document
          </button>
        </div>

        {Array.isArray(processedPortfolio) && processedPortfolio.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                  className="flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 hover:border-[#093fb4]/30 rounded-lg shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded bg-blue-50/60 border border-blue-100 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-[#093fb4]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate group-hover:text-[#093fb4] transition-colors">
                      {itemTitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Digital Copy • Attached</p>
                  </div>
                  <ExternalLink size={13} className="text-slate-300 group-hover:text-slate-400 shrink-0 ml-1" />
                </a>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center">
            <FileText size={20} className="text-slate-300 mb-1.5" />
            <p className="text-xs text-slate-400 italic font-medium">No verified extra portfolio files uploaded yet.</p>
          </div>
        )}
      </div>

      {/* --- WORKFLOW PROFILE MANAGEMENT MODALS --- */}
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