import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  LockKeyhole, 
  ArrowRight, 
  Search, 
  FileCheck, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Sparkles, 
  UserPlus, 
  ClipboardCheck 
} from 'lucide-react';

import OrganizationRegisterModal from './OrganizationRegisterModal';

// Animation wrapper component
const ScrollReveal = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const currentRef = domRef.current;
    
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // UPDATED: This will toggle visibility ON and OFF 
        // every time the element enters or leaves the screen
        setIsVisible(entry.isIntersecting);
      });
    }, { 
      threshold: 0.1,
      // Optional: Add rootMargin to trigger the animation slightly 
      // before the element actually enters the viewport
      rootMargin: "0px 0px -50px 0px" 
    });

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12' // Elements drop down and hide when off-screen
      }`}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col relative selection:bg-blue-100 selection:text-blue-700">
      
      {/* --- STICKY HEADER --- */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter italic">
              Kyus<span className="text-blue-600">ISKO</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="hidden lg:flex px-6 py-2.5 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-all items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Building2 size={16} />
              PARTNER WITH US
            </button>

            <button 
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              <LockKeyhole size={16} />
              LOGIN PORTAL
            </button>
          </div>
        </div>
      </header>

      <OrganizationRegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />

      {/* --- LOGIN MODAL --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LockKeyhole size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Welcome Back</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium">Select your portal to continue.</p>
            </div>

            <div className="grid gap-4">
              <button onClick={() => navigate('/student-login')} className="group flex items-center justify-between p-6 bg-slate-50 hover:bg-blue-600 rounded-3xl transition-all border border-slate-100 hover:border-blue-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <GraduationCap />
                  </div>
                  <div className="text-left text-slate-900 group-hover:text-white">
                    <p className="font-black leading-none">Student Portal</p>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Application & Profile</p>
                  </div>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

              <button onClick={() => navigate('/rootlogin')} className="group flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-900 rounded-3xl transition-all border border-slate-100 hover:border-slate-900">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                    <LockKeyhole />
                  </div>
                  <div className="text-left text-slate-900 group-hover:text-white">
                    <p className="font-black leading-none">Admin / Staff</p>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Management Access</p>
                  </div>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow overflow-x-hidden">
        
        {/* SECTION 1: HERO */}
        <section className="relative px-6 py-20 lg:py-32 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold tracking-wide uppercase">
              <Sparkles size={14} /> New scholarships available for 2026
            </div>
            <h2 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900">
              Unlock Your <br />
              <span className="text-blue-600">Potential.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-md font-medium leading-relaxed">
              Quezon City's premier digital gateway connecting bright minds to life-changing educational opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigate('/student-register')} 
                className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group text-lg"
              >
               Apply Now <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative animate-in zoom-in duration-1000">
             <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
             <div className="grid gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4 hover:border-blue-200 transition-colors">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Search /></div>
                   <h4 className="font-black text-xl">Smart Discovery</h4>
                   <p className="text-slate-500 text-sm leading-relaxed font-medium">Our algorithm matches your unique student profile with the most compatible grants and local scholarships.</p>
                </div>
                <div 
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-slate-300 cursor-pointer group hover:scale-[1.02] transition-all"
                >
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400"><Building2 /></div>
                   <h4 className="font-black text-xl group-hover:text-blue-400 transition-colors">For Organizations</h4>
                   <p className="text-slate-400 text-sm leading-relaxed font-medium">Scale your impact. Partner with KyusIsko to manage applicants and distribute funds efficiently.</p>
                </div>
             </div>
          </div>
        </section>

        {/* SECTION 2: THE PROCESS (Scroll Reveal) */}
        <section className="bg-slate-50 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16 space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">How it Works</h3>
                <p className="text-slate-500 font-medium">Get started with your scholarship journey in three simple steps.</p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <UserPlus />, title: "Create Profile", desc: "Build your academic resume and upload basic requirements once." },
                { icon: <Search />, title: "Discover & Apply", desc: "Browse a curated list of scholarships and apply with a single click." },
                { icon: <ClipboardCheck />, title: "Track Status", desc: "Monitor your application progress in real-time through your dashboard." }
              ].map((step, idx) => (
                <ScrollReveal key={idx}>
                  <div className="bg-white p-10 rounded-[2rem] border border-slate-100 text-center space-y-6 hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-100">
                      {step.icon}
                    </div>
                    <h4 className="text-xl font-black">{step.title}</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: CALL TO ACTION */}
        <section className="py-24 px-6 overflow-hidden">
          <ScrollReveal>
            <div className="max-w-5xl mx-auto bg-blue-600 rounded-[3rem] p-12 lg:p-20 text-center text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10"><GraduationCap size={200} /></div>
              <h3 className="text-4xl lg:text-5xl font-black mb-6 relative z-10">Ready to start your journey?</h3>
              <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto font-medium">Join thousands of students who have found their future through KyusIsko.</p>
              <button 
                onClick={() => navigate('/student-register')}
                className="bg-white text-blue-600 px-12 py-5 rounded-2xl font-black hover:bg-slate-100 transition-colors shadow-xl"
              >
                Create Free Account
              </button>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><GraduationCap size={18} /></div>
                <h1 className="text-xl font-black tracking-tighter italic">Kyus<span className="text-blue-600">ISKO</span></h1>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Empowering the youth of Quezon City through digitalized scholarship management and equal opportunity access.
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Platform</h5>
              <ul className="space-y-4 text-sm text-slate-500 font-bold">
                <li className="hover:text-blue-600 cursor-pointer transition-colors">Find Scholarships</li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">Partner Donors</li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">How it Works</li>
                <li className="hover:text-blue-600 cursor-pointer transition-colors">Support</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Contact</h5>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li className="flex items-center gap-3"><Mail size={16} className="text-blue-600" /> support@kyusisko.gov.ph</li>
                <li className="flex items-center gap-3"><Phone size={16} className="text-blue-600" /> (02) 8123-4567</li>
                <li className="flex items-start gap-3"><MapPin size={16} className="text-blue-600 shrink-0" /> <span>QC Hall Compound, Diliman, Quezon City</span></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold text-slate-900 uppercase text-xs tracking-widest">System</h5>
              <p className="text-xs text-slate-400 leading-relaxed">Authorized personnel only. Access donor dashboards here.</p>
              <button onClick={() => navigate('/rootlogin')} className="text-xs font-black text-blue-600 hover:tracking-widest transition-all">ADMIN LOGIN →</button>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">© 2026 KyusISKO Scholarship Management System</p>
            <div className="flex gap-6 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="hover:text-blue-600 cursor-pointer">Privacy</span>
              <span className="hover:text-blue-600 cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}