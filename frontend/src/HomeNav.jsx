import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  UserPlus, 
  LogIn, 
  FileText,
  UserCircle,
  GraduationCap,
  Mail,
  Menu
} from 'lucide-react';

const HomeNav = () => {
  const navigate = useNavigate();
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);
  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const partnerMenuRef = useRef(null);
  const studentMenuRef = useRef(null);

  // Close menus on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partnerMenuRef.current && !partnerMenuRef.current.contains(event.target)) {
        setShowPartnerMenu(false);
      }
      if (studentMenuRef.current && !studentMenuRef.current.contains(event.target)) {
        setShowStudentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-[60] font-['Inter'] transition-all duration-500 ${
        scrolled
          ? 'bg-slate-900/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)] border-b border-slate-800'
          : 'bg-transparent border-b border-white/10'
      }`}
    >
      <div className="w-full px-12 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="KyusISKO Logo" className="h-11 w-auto" />
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[11px] font-black tracking-[0.12em] uppercase text-white">
          <button onClick={() => scrollToSection('about')} className="transition-colors hover:text-blue-400">About Us</button>
          <button onClick={() => scrollToSection('contact')} className="transition-colors hover:text-blue-400 flex items-center gap-1.5"><Mail size={13} strokeWidth={2.5} /> Contact Us</button>
          <button onClick={() => scrollToSection('scholarships')} className="transition-colors hover:text-blue-400 flex items-center gap-1.5"><GraduationCap size={13} strokeWidth={2.5} /> Scholarships</button>

          {/* Provider Dropdown */}
          <div className="relative" ref={partnerMenuRef}>
            <button onClick={() => setShowPartnerMenu(!showPartnerMenu)} className={`flex items-center gap-1.5 transition-all uppercase ${showPartnerMenu ? 'text-blue-400' : 'hover:text-blue-400'}`}>
              Provider 
              <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${showPartnerMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPartnerMenu && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-1.5 flex flex-col gap-0.5">
                  <button onClick={() => { navigate('/organization-register'); setShowPartnerMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-slate-900"><UserPlus size={16} /> Create Provider Account</button>
                  {/* UPDATED: Points to unified login */}
                  <button onClick={() => { navigate('/login'); setShowPartnerMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-slate-900"><LogIn size={16} /> Provider Login</button>
                  <button onClick={() => { navigate('/provider-guidelines'); setShowPartnerMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg border-t border-slate-50 text-slate-900"><FileText size={16} /> Provider Guidelines</button>
                </div>
              </div>
            )}
          </div>

          {/* Students Dropdown */}
          <div className="relative" ref={studentMenuRef}>
            <button onClick={() => setShowStudentMenu(!showStudentMenu)} className={`flex items-center gap-1.5 transition-all uppercase ${showStudentMenu ? 'text-blue-400' : 'hover:text-blue-400'}`}>
              <Menu size={14} strokeWidth={2.5} /> Students
              <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${showStudentMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStudentMenu && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-1.5 flex flex-col gap-0.5">
                  <button onClick={() => { navigate('/student-register'); setShowStudentMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-slate-900"><UserPlus size={16} /> Student Sign Up</button>
                  {/* UPDATED: Points to unified login */}
                  <button onClick={() => { navigate('/login'); setShowStudentMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-slate-900"><UserCircle size={16} /> Student Portal Login</button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')} 
            className="px-5 py-2.5 bg-[#093fb4] text-[#FFFCFB] text-[11px] font-black uppercase tracking-[0.12em] rounded-xl hover:bg-[#073496] transition-all shadow-md shadow-[#093fb4]/10 flex items-center gap-1.5 group"
          >
            <LogIn size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            Log In
          </button>
        </div>
      </div>
    </header>
  );
};

export default HomeNav;