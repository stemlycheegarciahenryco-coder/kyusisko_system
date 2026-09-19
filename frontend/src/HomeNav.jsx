import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  UserPlus, 
  LogIn, 
  FileText,
  UserCircle,
  Menu,
  X
} from 'lucide-react';

const HomeNav = () => {
  const navigate = useNavigate();
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);
  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePartnerOpen, setMobilePartnerOpen] = useState(false);
  const [mobileStudentOpen, setMobileStudentOpen] = useState(false);
  
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

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close the mobile menu on viewport resize past the lg breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setMobilePartnerOpen(false);
        setMobileStudentOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const goTo = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setShowPartnerMenu(false);
    setShowStudentMenu(false);
    setMobilePartnerOpen(false);
    setMobileStudentOpen(false);
  };

  // Shared navbar text & layout styles for perfect consistency
  const navItemClass = "text-[13px] font-black tracking-[0.12em] uppercase transition-colors flex items-center gap-1.5 cursor-pointer";

  return (
    <header
      className={`sticky top-0 z-[60] font-['Inter'] transition-all duration-500 ${
        scrolled
          ? 'bg-slate-900/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)] border-b border-slate-800'
          : 'bg-transparent border-b border-white/10'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center cursor-pointer shrink-0" onClick={() => goTo('/')}>
          <img src="/logo.png" alt="KyusISKO Logo" className="h-10 sm:h-12 lg:h-14 w-auto" />
        </div>

        {/* Center Nav Links (desktop / large screens only) */}
        <nav className="hidden lg:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('about')} 
            className={`${navItemClass} text-white hover:text-blue-400`}
          >
            About Us
          </button>
          
          <button 
            onClick={() => scrollToSection('contact')} 
            className={`${navItemClass} text-white hover:text-blue-400`}
          >
            Contact Us
          </button>
          
          <button 
            onClick={() => scrollToSection('scholarships')} 
            className={`${navItemClass} text-white hover:text-blue-400`}
          >
            Scholarships
          </button>

          {/* Provider Dropdown */}
          <div className="relative" ref={partnerMenuRef}>
            <button 
              onClick={() => setShowPartnerMenu(!showPartnerMenu)} 
              className={`${navItemClass} ${showPartnerMenu ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
            >
              Provider 
              <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-300 ${showPartnerMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPartnerMenu && (
              <div className="absolute top-full left-0 mt-3 w-72 bg-slate-900/85 backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 flex flex-col gap-1">
                  <button 
                    onClick={() => goTo('/organization-register')} 
                    className="flex items-center gap-3 px-3.5 py-3 text-white text-[13px] font-black tracking-[0.12em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <UserPlus size={16} strokeWidth={2.5} /> Create Provider Account
                  </button>
                  <button 
                    onClick={() => goTo('/provider-guidelines')} 
                    className="flex items-center gap-3 px-3.5 py-3 text-white text-[13px] font-black tracking-[0.12em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <FileText size={16} strokeWidth={2.5} /> Provider Guidelines
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Students Dropdown */}
          <div className="relative" ref={studentMenuRef}>
            <button 
              onClick={() => setShowStudentMenu(!showStudentMenu)} 
              className={`${navItemClass} ${showStudentMenu ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
            >
              Students
              <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-300 ${showStudentMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStudentMenu && (
              <div className="absolute top-full left-0 mt-3 w-72 bg-slate-900/85 backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 flex flex-col gap-1">
                  <button 
                    onClick={() => goTo('/student-register')} 
                    className="flex items-center gap-3 px-3.5 py-3 text-white text-[13px] font-black tracking-[0.12em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <UserPlus size={16} strokeWidth={2.5} /> Student Sign Up
                  </button>
                  <button 
                    onClick={() => goTo('/login')} 
                    className="flex items-center gap-3 px-3.5 py-3 text-white text-[13px] font-black tracking-[0.12em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <UserCircle size={16} strokeWidth={2.5} /> Student Scholarship
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => goTo('/login')} 
            className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-[#093fb4] text-[#FFFCFB] text-[11px] sm:text-[13px] font-black uppercase tracking-[0.1em] sm:tracking-[0.12em] rounded-xl hover:bg-[#073496] transition-all shadow-md shadow-[#093fb4]/10 flex items-center gap-1.5 sm:gap-2 group cursor-pointer whitespace-nowrap"
          >
            <LogIn size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden xs:inline sm:inline">Sign In</span>
          </button>

          {/* Hamburger toggle (mobile / tablet only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down panel */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-slate-900/95 backdrop-blur-xl border-b border-white/10 ${
          mobileMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="overflow-y-auto max-h-[85vh] px-4 sm:px-6 py-4 flex flex-col gap-1">
          <button 
            onClick={() => scrollToSection('about')} 
            className="text-left text-white text-[13px] font-black tracking-[0.12em] uppercase py-3.5 px-2 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all cursor-pointer"
          >
            About Us
          </button>

          <button 
            onClick={() => scrollToSection('contact')} 
            className="text-left text-white text-[13px] font-black tracking-[0.12em] uppercase py-3.5 px-2 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all cursor-pointer"
          >
            Contact Us
          </button>

          <button 
            onClick={() => scrollToSection('scholarships')} 
            className="text-left text-white text-[13px] font-black tracking-[0.12em] uppercase py-3.5 px-2 rounded-xl hover:bg-white/10 hover:text-blue-400 transition-all cursor-pointer"
          >
            Scholarships
          </button>

          {/* Provider accordion */}
          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              onClick={() => setMobilePartnerOpen(!mobilePartnerOpen)}
              className={`w-full flex items-center justify-between text-[13px] font-black tracking-[0.12em] uppercase py-3.5 px-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer ${mobilePartnerOpen ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
            >
              Provider
              <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-300 ${mobilePartnerOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobilePartnerOpen && (
              <div className="flex flex-col gap-1 pb-2 pl-2">
                <button 
                  onClick={() => goTo('/organization-register')} 
                  className="flex items-center gap-3 px-3.5 py-3 text-white/90 text-[12px] font-black tracking-[0.1em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                >
                  <UserPlus size={16} strokeWidth={2.5} /> Create Provider Account
                </button>
                <button 
                  onClick={() => goTo('/provider-guidelines')} 
                  className="flex items-center gap-3 px-3.5 py-3 text-white/90 text-[12px] font-black tracking-[0.1em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                >
                  <FileText size={16} strokeWidth={2.5} /> Provider Guidelines
                </button>
              </div>
            )}
          </div>

          {/* Students accordion */}
          <div className="border-t border-white/10 pt-1">
            <button
              onClick={() => setMobileStudentOpen(!mobileStudentOpen)}
              className={`w-full flex items-center justify-between text-[13px] font-black tracking-[0.12em] uppercase py-3.5 px-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer ${mobileStudentOpen ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
            >
              Students
              <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-300 ${mobileStudentOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileStudentOpen && (
              <div className="flex flex-col gap-1 pb-2 pl-2">
                <button 
                  onClick={() => goTo('/student-register')} 
                  className="flex items-center gap-3 px-3.5 py-3 text-white/90 text-[12px] font-black tracking-[0.1em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                >
                  <UserPlus size={16} strokeWidth={2.5} /> Student Sign Up
                </button>
                <button 
                  onClick={() => goTo('/login')} 
                  className="flex items-center gap-3 px-3.5 py-3 text-white/90 text-[12px] font-black tracking-[0.1em] uppercase hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all text-left cursor-pointer"
                >
                  <UserCircle size={16} strokeWidth={2.5} /> Student Scholarship
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeNav;