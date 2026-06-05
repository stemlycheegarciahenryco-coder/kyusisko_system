import React from 'react';
import { User, Phone, Mail, ExternalLink, School, BookOpen, Users, MapPin, Award } from 'lucide-react';

const backendURL = "http://localhost:5000";

export default function ApplicationStudentProfile({ detail }) {
  if (!detail) return null;

  // Safe Parsing Tool: Prevent crash if portfolio_data is stored as a string or text array
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

  // Determine Primary Caretaker info
  const parentName = detail.guardian_name || detail.father_name || detail.mother_name || '—';
  const parentRelationship = detail.guardian_name 
    ? 'Guardian' 
    : detail.father_name 
    ? 'Father' 
    : detail.mother_name 
    ? 'Mother' 
    : 'Parent';

  const parentContact = detail.guardian_contact || detail.father_contact || detail.mother_contact || '—';

  return (
    <div className="bg-[#093fb4] rounded-2xl overflow-hidden shadow-lg border border-[#093fb4]/20 font-sans">
      
      {/* 1. Header: Avatar + Name Row */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-4 bg-gradient-to-b from-black/10 to-transparent">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
          {detail.sprofile_pic
            ? <img
                src={`${backendURL}/uploads/${detail.sprofile_pic}`}
                className="w-full h-full object-cover"
                alt="Student Profile"
              />
            : <User size={32} className="text-white/80" />}
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-2xl tracking-tight truncate">
            {detail.sfirst_name} {detail.slast_name}
          </h1>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5 opacity-90">
            <BookOpen size={13} className="shrink-0" /> {detail.course || 'Student Applicant'}
          </p>
        </div>
      </div>

      {/* 2. Core Academic & Family Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-4 mb-3">
        {/* Academic Card */}
        <div className="bg-white/10 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/15">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80 mb-2 flex items-center gap-1.5">
            <School size={12} /> Academic Information
          </p>
          <p className="text-sm font-bold text-white tracking-tight leading-snug">{detail.school || '—'}</p>
          <p className="text-xs text-white/80 font-medium mt-1 truncate">{detail.course || '—'}</p>
        </div>

        {/* Parent / Emergency Contact Card */}
        <div className="bg-white/10 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/15">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80 mb-2 flex items-center gap-1.5">
            <Users size={12} /> Emergency Contact
          </p>
          <p className="text-sm font-bold text-white tracking-tight leading-snug">
            {parentName} <span className="text-xs font-normal text-blue-200/70 ml-1">({parentRelationship})</span>
          </p>
          <p className="text-xs text-white/80 font-medium mt-1 flex items-center gap-1.5">
            <Phone size={12} className="opacity-70" /> {parentContact}
          </p>
        </div>
      </div>

      {/* 3. Home Address Section */}
      <div className="bg-white/10 border border-white/10 rounded-xl p-4 mx-4 mb-3 transition-all hover:bg-white/15 flex gap-3 items-start">
        <MapPin size={16} className="text-blue-200 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80 mb-1">Home Address</p>
          <p className="text-sm text-white font-medium leading-relaxed">{detail.house_address || 'No address provided.'}</p>
        </div>
      </div>

      {/* 4. White High-Contrast Contact Utility Bar */}
      <div className="bg-white mx-4 mb-4 rounded-xl p-4 flex flex-wrap gap-x-6 gap-y-2.5 shadow-md border border-slate-100">
        {detail.student_email && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-[#093fb4] transition-colors">
            <Mail size={14} className="text-[#093fb4]" />
            <span className="truncate max-w-[200px]">{detail.student_email}</span>
          </div>
        )}
        {detail.scontact_number && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Phone size={14} className="text-[#093fb4]" />
            <span>{detail.scontact_number}</span>
          </div>
        )}
        {detail.sgender && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <User size={14} className="text-[#093fb4]" />
            <span>{detail.sgender}</span>
          </div>
        )}
      </div>

      {/* 5. Bio Segment */}
      {detail.bio && (
        <div className="px-6 pb-4 pt-1 border-t border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80 mb-1.5">Personal Bio</p>
          <p className="text-white/90 text-sm font-medium leading-relaxed max-w-2xl">{detail.bio}</p>
        </div>
      )}

      {/* 6. Achievements / Portfolio Link Workspace */}
      {Array.isArray(processedPortfolio) && processedPortfolio.length > 0 && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80 mb-3 flex items-center gap-1.5">
            <Award size={12} /> Student Achievements & Portfolio
          </p>
          <div className="flex flex-wrap gap-2">
            {processedPortfolio.map((item, idx) => {
              if (!item) return null;
              
              const itemTitle = typeof item === 'object' ? item.title : item;
              let rawLink = typeof item === 'object' ? (item.link || item.url || item.href) : null;
              
              if (rawLink && typeof rawLink === 'string') {
                rawLink = rawLink.trim().replace(/\\/g, '/');
                if (rawLink.startsWith('uploads/')) {
                  rawLink = `${backendURL}/${rawLink}`;
                } else if (!/^https?:\/\//i.test(rawLink)) {
                  rawLink = `https://${rawLink}`;
                }
              }

              const hasLink = !!rawLink;
              const Tag = hasLink ? 'a' : 'span';
              
              return (
                <Tag
                  key={idx}
                  {...(hasLink 
                    ? { href: rawLink, target: '_blank', rel: 'noreferrer' } 
                    : { onClick: (e) => e.preventDefault() }
                  )}
                  className={[
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm',
                    hasLink 
                      ? 'bg-white text-[#093fb4] border-white hover:bg-blue-50 hover:scale-[1.02] cursor-pointer' 
                      : 'bg-white/10 text-white border-white/10 select-none',
                  ].join(' ')}
                >
                  <span className="truncate max-w-[180px]">
                    {itemTitle || (typeof item === 'object' && item.type) || `Attachment #${idx + 1}`}
                  </span>
                  {hasLink && <ExternalLink size={12} className="opacity-80 shrink-0" />}
                </Tag>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}