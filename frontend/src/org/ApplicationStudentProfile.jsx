import React from 'react';
import { User, Phone, Mail, ExternalLink, School, BookOpen, Users, MapPin, Award, Calendar, ShieldAlert } from 'lucide-react';

const backendURL = "http://localhost:5000";

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-slate-800 font-semibold truncate max-w-[180px]">{value || '—'}</span>
    </div>
  );
}

export default function ApplicationStudentProfile({ detail }) {
  if (!detail) return null;

  let processedPortfolio = [];
  try {
    if (detail.portfolio_data) {
      processedPortfolio = typeof detail.portfolio_data === 'string' 
        ? JSON.parse(detail.portfolio_data) 
        : detail.portfolio_data;
    }
  } catch (e) {
    console.error("Failed parsing achievements data", e);
  }

  const parentName = detail.guardian_name || detail.father_name || detail.mother_name || '—';
  const parentRelationship = detail.guardian_name ? 'Guardian' : detail.father_name ? 'Father' : detail.mother_name ? 'Mother' : 'Parent';
  const parentContact = detail.guardian_contact || detail.father_contact || detail.mother_contact || '—';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 w-full text-slate-800">
      
      {/* SECTION HEADER */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <User size={16} className="text-[#093fb4]" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Profile</h2>
      </div>

      {/* TOP USER BIO SEGMENT */}
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
          {detail.sprofile_pic
            ? <img src={detail.sprofile_pic} className="w-full h-full object-cover" alt="Student Profile" />
            : <User size={36} className="text-slate-300" />}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {detail.sfirst_name} {detail.slast_name}
          </h1>
          <p className="text-[#093fb4] text-sm font-semibold">
            {detail.course || 'Unspecified Degree Track'}
          </p>
          
          {/* Metadata Chips directly underneath */}
          <div className="flex flex-wrap gap-2 pt-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 font-medium">
              <User size={12} className="text-slate-400" />
              <span>Student ID: <strong className="text-slate-700">{detail.student_id || '2023-45678'}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 font-medium">
              <Award size={12} className="text-slate-400" />
              <span>Applicant Type: <strong className="text-slate-700">New Applicant</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED INFORMATION SUB-GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* ACADEMIC INFORMATION */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
            <School size={14} className="text-[#093fb4]" />
            <span>Academic Information</span>
          </div>
          <div className="space-y-0.5">
            <InfoRow label="School" value={detail.school} />
            <InfoRow label="Program" value={detail.course} />
            <InfoRow label="Year Level" value={detail.year_level || '3rd Year'} />
            <InfoRow label="GWA" value={detail.gwa || '1.45'} />
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
            <User size={14} className="text-[#093fb4]" />
            <span>Personal Information</span>
          </div>
          <div className="space-y-0.5">
            <InfoRow label="Email" value={detail.student_email} />
            <InfoRow label="Contact Number" value={detail.scontact_number} />
            <InfoRow label="Gender" value={detail.sgender} />
            <InfoRow label="Date of Birth" value={detail.dob ? new Date(detail.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'January 12, 2003'} />
          </div>
        </div>

      </div>

      {/* FULL-WIDTH HOME ADDRESS INFO BOX */}
      <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1">
        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider mb-1">
          <MapPin size={14} className="text-[#093fb4]" />
          <span>Home Address</span>
        </div>
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          {detail.house_address || 'No complete address recorded.'}
        </p>
      </div>

      {/* EMERGENCY CONTACT TIMELINE TRACK */}
      <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider mb-3">
          <Users size={14} className="text-[#093fb4]" />
          <span>Emergency Contact</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Name</p>
            <p className="font-semibold text-slate-700">{parentName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Relationship</p>
            <p className="font-semibold text-slate-700">{parentRelationship}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Contact Number</p>
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" /> {parentContact}
            </p>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS / PORTFOLIO */}
      <div>
        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider mb-3">
          <Award size={14} className="text-[#093fb4]" />
          <span>Achievements / Portfolio</span>
        </div>
        {Array.isArray(processedPortfolio) && processedPortfolio.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {processedPortfolio.slice(0, 3).map((item, idx) => {
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
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-[#093fb4]/40 rounded-lg text-xs font-medium text-slate-700 shadow-sm transition-all group"
                >
                  <FileText size={14} className="text-[#093fb4] bg-blue-50 rounded" />
                  <div className="truncate max-w-[120px]">
                    <p className="font-semibold truncate group-hover:text-[#093fb4]">{itemTitle}</p>
                    <p className="text-[10px] text-slate-400 font-normal">PDF • 1.2 MB</p>
                  </div>
                  <ExternalLink size={10} className="text-slate-400 ml-1 shrink-0" />
                </a>
              );
            })}
            
            {processedPortfolio.length > 3 && (
              <button className="text-xs font-bold text-[#093fb4] hover:underline px-2 py-1 flex items-center gap-1">
                View All ({processedPortfolio.length}) →
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No custom achievements submitted.</p>
        )}
      </div>

    </div>
  );
}