import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LockKeyhole, 
  ChevronDown, 
  UserPlus, 
  LogIn, 
  FileText,
  UserCircle,
  GraduationCap,
  Mail,
  Menu,
  X
} from 'lucide-react';

const HomeNav = () => {
  const navigate = useNavigate();
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);
  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const partnerMenuRef = useRef(null);
  const studentMenuRef = useRef(null);
  const modalRef = useRef(null);

  // Close menus and modal on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partnerMenuRef.current && !partnerMenuRef.current.contains(event.target)) {
        setShowPartnerMenu(false);
      }
      if (studentMenuRef.current && !studentMenuRef.current.contains(event.target)) {
        setShowStudentMenu(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowLoginModal(false);
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
    <>
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

          {/* Center Nav Links arranged in requested order */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-black tracking-[0.12em] uppercase text-white">
            
            {/* 1. About Us */}
            <button
              onClick={() => scrollToSection('about')}
              className="transition-colors hover:text-blue-400 flex items-center gap-1.5 uppercase"
            >
              About Us
            </button>

            {/* 2. Contact Us */}
            <button
              onClick={() => scrollToSection('contact')}
              className="transition-colors hover:text-blue-400 flex items-center gap-1.5 uppercase"
            >
              <Mail size={13} strokeWidth={2.5} />
              Contact Us
            </button>

            {/* 3. Scholarships */}
            <button
              onClick={() => scrollToSection('scholarships')}
              className="transition-colors hover:text-blue-400 flex items-center gap-1.5 uppercase"
            >
              <GraduationCap size={13} strokeWidth={2.5} />
              Scholarships
            </button>

            {/* 4. Provider Dropdown */}
            <div className="relative" ref={partnerMenuRef}>
              <button
                onClick={() => setShowPartnerMenu(!showPartnerMenu)}
                className={`flex items-center gap-1.5 transition-all uppercase ${
                  showPartnerMenu ? 'text-blue-400' : 'hover:text-blue-400'
                }`}
              >
                Provider 
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`transition-transform duration-300 ${showPartnerMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showPartnerMenu && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button
                      onClick={() => { navigate('/organization-register'); setShowPartnerMenu(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all group"
                    >
                      <div className="p-2 bg-blue-50 text-[#093fb4] rounded-md group-hover:bg-[#093fb4] group-hover:text-white">
                        <UserPlus size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-900 normal-case tracking-normal">Create Provider Account</span>
                    </button>
                    <button
                      onClick={() => { navigate('/rootlogin'); setShowPartnerMenu(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all group"
                    >
                      <div className="p-2 bg-blue-50 text-[#093fb4] rounded-md group-hover:bg-[#093fb4] group-hover:text-white">
                        <LogIn size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-900 normal-case tracking-normal">Provider Login</span>
                    </button>
                    <button
                      onClick={() => { navigate('/provider-guidelines'); setShowPartnerMenu(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all group border-t border-slate-50 mt-1"
                    >
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-md group-hover:bg-slate-900 group-hover:text-white">
                        <FileText size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-900 normal-case tracking-normal">Provider Guidelines</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Students Dropdown */}
            <div className="relative" ref={studentMenuRef}>
              <button
                onClick={() => setShowStudentMenu(!showStudentMenu)}
                className={`flex items-center gap-1.5 transition-all uppercase ${
                  showStudentMenu ? 'text-blue-400' : 'hover:text-blue-400'
                }`}
              >
                <Menu size={14} strokeWidth={2.5} />
                Students
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`transition-transform duration-300 ${showStudentMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showStudentMenu && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button
                      onClick={() => { navigate('/student-register'); setShowStudentMenu(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all group"
                    >
                      <div className="p-2 bg-blue-50 text-[#093fb4] rounded-md group-hover:bg-[#093fb4] group-hover:text-white">
                        <UserPlus size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-900 normal-case tracking-normal">Student Sign Up</span>
                    </button>
                    <button
                      onClick={() => { navigate('/student-login'); setShowStudentMenu(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all group"
                    >
                      <div className="p-2 bg-slate-50 text-slate-700 rounded-md group-hover:bg-slate-900 group-hover:text-white">
                        <UserCircle size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-900 normal-case tracking-normal">Student Portal Login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2.5 bg-[#093fb4] text-[#FFFCFB] text-[11px] font-black uppercase tracking-[0.12em] rounded-xl hover:bg-[#073496] transition-all shadow-md shadow-[#093fb4]/10 flex items-center gap-1.5 group"
            >
              <LogIn size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              Log In
            </button>
          </div>
        </div>
      </header>

      {/* Account Gateway Selection Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            ref={modalRef}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header with Centered Content and Non-Transparent Logo */}
            <div className="p-6 pb-4 flex flex-col items-center text-center border-b border-slate-100 relative">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              
              <div className="flex flex-col items-center gap-2 mt-2">
                <img src="/logo.png" alt="KyusISKO Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h3 className="text-md font-black tracking-wide text-slate-900 uppercase font-['Inter'] mt-1">Account Gateway</h3>
                  <p className="text-xs text-slate-500 font-medium">Select your portal access point below.</p>
                </div>
              </div>
            </div>

            {/* Portal Option Nodes */}
            <div className="p-5 flex flex-col gap-3">
              {/* Student Option */}
              <button
                onClick={() => { navigate('/student-login'); setShowLoginModal(false); }}
                className="flex items-center justify-between w-full p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/70 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#093fb4] text-white rounded-xl shadow-md shadow-[#093fb4]/20">
                    <UserCircle size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Student Login</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Access application forms, status & profile.</p>
                  </div>
                </div>
                <ChevronDown size={16} className="-rotate-90 text-slate-400 group-hover:text-[#093fb4] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Consistent Blue Provider Option */}
              <button
                onClick={() => { navigate('/rootlogin'); setShowLoginModal(false); }}
                className="flex items-center justify-between w-full p-4 bg-blue-50/30 hover:bg-blue-50 border border-blue-100/50 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#093fb4] text-white rounded-xl shadow-md shadow-[#093fb4]/20">
                    <LogIn size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Provider Login</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Manage systems, evaluation grids & donors.</p>
                  </div>
                </div>
                <ChevronDown size={16} className="-rotate-90 text-slate-400 group-hover:text-[#093fb4] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeNav;