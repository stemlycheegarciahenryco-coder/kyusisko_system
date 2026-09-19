import React, { useState, useEffect } from 'react';
import { useStudent } from './StudentContext';
import { User2Icon, MapPin, Mail, Phone, GraduationCap } from 'lucide-react';
import api from '../api';

export default function StudentLeftProfile() {
  const { student, loading } = useStudent();

  if (loading) {
    return <div className="w-full h-[450px] bg-white/60 backdrop-blur-xl rounded-[2.5rem] animate-pulse shadow-xl border-2 border-white/80" />;
  }

  if (!student) return null;

  // Syncing variables to perfectly read values from your full profile JOIN query
  const displayCourse = student.course_name === 'Others' || !student.course_name
    ? student.other_degree_program || 'Student Course'
    : student.course_name;

  const displaySchool = student.college_name === 'Others' || !student.college_name
    ? student.other_school || 'Student University/School'
    : student.college_name;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/80 overflow-hidden shadow-xl font-['Inter']">
      
      {/* Header Banner Background */}
      <div className="h-28 bg-[#093fb4] relative">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="px-6 pb-8">
        
        {/* Avatar Area */}
        <div
          className="rounded-[2rem] bg-white border-4 border-white shadow-lg mx-auto -mt-14 overflow-hidden mb-4 flex items-center justify-center relative z-10"
          style={{ width: 104, height: 104 }}
        >
          {student.sprofile_pic ? (
            <img
              src={student.sprofile_pic}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          ) : (
            <User2Icon size={48} className="text-[#093fb4]" strokeWidth={2} />
          )}
        </div>

        {/* Name, Course, and School */}
        <div className="text-center mb-6 space-y-2">
          <h2 className="text-2xl font-black text-black uppercase leading-tight tracking-tight">
            {student.sfirst_name} {student.slast_name}
          </h2>
          
          <p className="text-[#093fb4] text-xs font-black uppercase tracking-[0.2em] leading-normal">
            {displayCourse}
          </p>

          <p className="text-black/50 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 leading-normal max-w-[240px] mx-auto break-words mt-1">
            <GraduationCap size={16} className="shrink-0" strokeWidth={2.5} /> {displaySchool}
          </p>
        </div>

        {/* Profile Details List Stack */}
        <div className="space-y-5 pt-6 border-t-2 border-black/5">

          {/* 1. Email Data Row */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black/40 shrink-0">
              <Mail size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-0.5">Email Address</p>
              <p className="text-sm font-extrabold text-black truncate lowercase">{student.student_email}</p>
            </div>
          </div>

          {/* 2. Phone Data Row */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black/40 shrink-0">
              <Phone size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-0.5">Contact Number</p>
              <p className="text-sm font-extrabold text-black uppercase tracking-wider">{student.scontact_number ? ` ${student.scontact_number}` : 'N/A'}</p>
            </div>
          </div>

          {/* 3. Address Data Row */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black/40 shrink-0">
              <MapPin size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-0.5">Address</p>
              <p className="text-sm font-extrabold text-black uppercase leading-snug break-words">
                {[student.sstreet, student.sbarangay, student.sdistrict].filter(Boolean).join(', ') || 'Not Provided'}
              </p>
            </div>
          </div>

          {/* Bio Section Row */}
          {student.bio && (
            <div className="pt-5 border-t-2 border-black/5">
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-2">About You</p>
              <p className="text-sm font-bold text-black/70 leading-relaxed break-words bg-black/5 p-4 rounded-2xl italic">
                "{student.bio}"
              </p>
            </div>
          )}

          {/* Portfolio Rendering Section */}
          {student.portfolio_data && (
            <div className="pt-5 border-t-2 border-black/5">
              <p className="text-[10px] font-black text-[#093fb4] uppercase tracking-[0.2em] mb-3">Portfolio Documents</p>
              <div className="flex flex-wrap gap-2">

                {typeof student.portfolio_data === 'object' && !Array.isArray(student.portfolio_data) && (student.portfolio_data.title || student.portfolio_data.url) && (
                  <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.15em] bg-[#093fb4]/10 text-[#093fb4] border-2 border-[#093fb4]/20 px-3 py-2 rounded-xl">
                    {student.portfolio_data.title || student.portfolio_data.type || 'Portfolio'}
                  </span>
                )}

                {Array.isArray(student.portfolio_data) &&
                  student.portfolio_data.map((item, idx) => (
                    (item.title || item.url || item.type) && (
                      <span key={idx} className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.15em] bg-[#093fb4]/10 text-[#093fb4] border-2 border-[#093fb4]/20 px-3 py-2 rounded-xl">
                         {item.title || item.type || 'Link'}
                      </span>
                    )
                  ))}

                {typeof student.portfolio_data === 'string' && student.portfolio_data.trim() !== '' && (
                  <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.15em] bg-[#093fb4]/10 text-[#093fb4] border-2 border-[#093fb4]/20 px-3 py-2 rounded-xl">
                    Portfolio Link
                  </span>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}