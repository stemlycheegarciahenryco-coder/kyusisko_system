import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Sparkles,
    Mail,
    Phone,
    CheckCircle2,
    ChevronDown,
    UserPlus,
    Search,
    Send,
    BookOpen,
    Building2,
    FileCheck,
    BadgeCheck,
} from 'lucide-react';
import HomeNav from './HomeNav';
import HomeProgram from './HomeProgram';

alert(`WARNING: THIS IS A SCHOOL PROJECT! 
\nThis platform is created solely for academic and educational purposes. We do not offer real scholarship programs, financial aid, or official grants. Do not submit sensitive personal data, financial information, or official credentials.
`)

/* ─── Scroll Reveal ─────────────────────────────────────────── */
const ScrollReveal = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => setIsVisible(e.isIntersecting)),
            { threshold: 0.1 }
        );
        const el = domRef.current;
        if (el) observer.observe(el);
        return () => { if (el) observer.unobserve(el); };
    }, []);

    return (
        <div
            ref={domRef}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-1000 ease-out transform ${isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
                }`}
        >
            {children}
        </div>
    );
};

/* ─── Steps data ─────────────────────────────────────────────── */
const STUDENT_STEPS = [
    { icon: UserPlus, label: 'Create Account', desc: 'Sign up for free with your student email and basic personal information.' },
    { icon: BookOpen, label: 'Set Up Your Profile', desc: 'Complete your profile so you can be matched with scholarships that fit you.' },
    { icon: Search, label: 'Find the Best Scholarship for You', desc: 'Explore and browse scholarship programs.' },
    { icon: FileCheck, label: 'Submit and Track Your Application', desc: 'Monitor you application status and comply with the provider requirements.' },
];

const PROVIDER_STEPS = [
    { icon: Building2, label: 'Create Provider Account', desc: 'Register an account for your institution or organization.' },
    { icon: BadgeCheck, label: 'Wait for Approval', desc: 'Our team reviews your details to verify your organization as a provider.' },
    { icon: BookOpen, label: 'Set Up the Provider Profile', desc: 'Once approved, complete your organization profile.' },
    { icon: FileCheck, label: 'Post and Review Scholarship Applicants', desc: 'Publish scholarships and review the students who apply.' },
];

/* ─── FAQ data ───────────────────────────────────────────────── */
const FAQS = [
    {
        q: 'Who can apply to KyusISKO?',
        a: 'Students and providers can use the platform and utilize the platform features.'
    },
    {
        q: 'How do I know if a scholarship provider is legitimate?',
        a: 'All scholarship providers on KyusISKO go through a vetting and verification process before their listings are published. You will see a "Vetted Provider" badge on verified organizations.'
    },
    {
        q: 'How to use KyusISKO as a student?',
        a: 'Register, and set up your profile to find the best scholarship that can help your academic journey.'
    },
    {
        q: 'How to use KyusISKO as a provider?',
        a: 'Create an account and comply with the requirements for verification of the provider. After approval, you can use and manage the platform  such as scholarship applicants management, tracking reports, and monitor the scholarship program status.'
    },
];

/* ─── FAQ Accordion Item ─────────────────────────────────────── */
const FAQItem = ({ q, a, index }) => {
    const [open, setOpen] = useState(false);
    return (
        <ScrollReveal delay={index * 60}>
            <div
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-[#093FB4] shadow-lg shadow-[#093FB4]/10' : 'border-slate-200 hover:border-[#093FB4]/40'
                    }`}
            >
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between px-7 py-5 text-left bg-white group"
                >
                    <span className={`text-[17px] font-black tracking-tight transition-colors ${open ? 'text-[#093FB4]' : 'text-slate-900 group-hover:text-[#093FB4]'}`}>
                        {q}
                    </span>
                    <ChevronDown
                        size={20}
                        strokeWidth={2.5}
                        className={`flex-shrink-0 ml-4 transition-all duration-300 ${open ? 'rotate-180 text-[#093FB4]' : 'text-slate-400'}`}
                    />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-64' : 'max-h-0'}`}>
                    <p className="px-7 pb-6 text-base text-slate-600 leading-relaxed font-medium bg-white">
                        {a}
                    </p>
                </div>
            </div>
        </ScrollReveal>
    );
};

/* ─── Home ──────────────────────────────────────────────────── */
export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FFFCFB] font-['Inter'] text-slate-800 flex flex-col relative selection:bg-blue-100 selection:text-[#093FB4]">

            <main className="flex-grow relative z-10">

                {/* ── SECTION 1: HERO ── */}
                <section className="relative w-full h-[560px] sm:h-[620px] lg:h-[700px] overflow-hidden">
                    <img
                        src="/circle.jpg"
                        alt="QC Memorial Circle"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />

                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%), linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 75%, transparent 100%)',
                        }}
                    />

                    <div className="absolute inset-0 flex flex-col">
                        <div className="w-full relative z-20 shrink-0">
                            <HomeNav />
                        </div>
                            {/*section header second*/}
                        <div className="flex-1 min-h-0 flex items-center overflow-hidden">
                            <div className="w-full max-w-6xl mx-auto px-6 sm:px-8">
                                <ScrollReveal>
                                    <div className="space-y-5 max-w-2xl">
                                        <div className="flex flex-wrap gap-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white rounded-lg text-[12px] font-black tracking-[0.2em] uppercase border border-white/30">
                                                <CheckCircle2 size={15} strokeWidth={3} /> 100% Free
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#093FB4]/80 backdrop-blur-sm text-white rounded-lg text-[12px] font-black tracking-[0.2em] uppercase border border-[#093FB4]">
                                                <Sparkles size={15} strokeWidth={3} className="text-blue-200" /> Vetted Scholarship Providers
                                            </div>
                                        </div>

                                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] tracking-tighter text-white drop-shadow-2xl">
                                            Kyus<span className="text-[#4d7fff]">IS</span><span className="text-[#4d7fff]">KO</span>
                                            <br />
                                            <span className="text-white text-2xl sm:text-3xl lg:text-5xl uppercase font-black">for College Students</span>
                                        </h2>

                                        <p className="text-sm sm:text-base text-white/80 font-semibold max-w-lg leading-relaxed">
                                            The premier scholarship discovery platform for Quezon City college students.
                                            Find, apply, and get funded — all in one place.
                                        </p>

                                        <div className="flex flex-wrap gap-3 sm:gap-4 pt-1">
                                            <button
                                                onClick={() => navigate('/student-register')}
                                                className="px-6 sm:px-10 py-3 sm:py-5 bg-[#093FB4] text-white font-black rounded-xl shadow-2xl hover:bg-[#0731a8] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group text-[13px] uppercase tracking-[0.2em]"
                                            >
                                                Get Started <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => document.getElementById('scholarships')?.scrollIntoView({ behavior: 'smooth' })}
                                                className="px-6 sm:px-10 py-3 sm:py-5 bg-white/15 backdrop-blur-sm text-white font-black rounded-xl border border-white/40 hover:bg-white/25 transition-all text-[13px] uppercase tracking-[0.2em]"
                                            >
                                                Browse Scholarships
                                            </button>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 2 — SCHOLARSHIP PROGRAMS ── */}
                <section id="scholarships" className="bg-white py-28 px-8">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16 space-y-4">
                                <span className="text-[#093FB4] text-[12px] font-black uppercase tracking-[0.5em]">Active Openings</span>
                                <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase">
                                    Featured <span className="text-[#093FB4]">Scholarships</span>
                                </h3>
                                <p className="text-slate-500 font-semibold text-base max-w-xl mx-auto leading-relaxed">
                                    Apply directly to open programs with verified coverage details and deadlines.
                                </p>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={100}>
                            <HomeProgram />
                        </ScrollReveal>

                    </div>
                </section>

                {/* ── SECTION 3 — HOW TO APPLY ── */}
                <section className="py-28 px-8 relative overflow-hidden" style={{ backgroundColor: '#FFFCFB' }}>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#093FB4]/6 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#093FB4]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    <div className="max-w-6xl mx-auto relative z-10">
                        <ScrollReveal>
                            <div className="text-center mb-16 space-y-4">
                                
                                <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase">
                                    How to <span className="text-[#093FB4]">Get Started</span>
                                </h3>
                                <p className="text-slate-500 font-semibold text-base max-w-xl mx-auto leading-relaxed">
                                    Whether you're a student looking for funding or an organization wanting to give back — it only takes a few steps.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid lg:grid-cols-2 gap-16">
                            <div>
                                <ScrollReveal>
                                    <div className="flex items-center gap-3 mb-9">
                                        <span className="px-5 py-2 bg-[#093FB4] text-white text-[12px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#093FB4]/20">
                                            For Students
                                        </span>
                                    </div>
                                </ScrollReveal>
                                <div className="space-y-5">
                                    {STUDENT_STEPS.map((step, i) => (
                                        <ScrollReveal key={i} delay={i * 80}>
                                            <div className="flex items-start gap-5 p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#093FB4]/40 hover:shadow-lg transition-all duration-300 group">
                                                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-[#093FB4]/10 text-[#093FB4] group-hover:bg-[#093FB4] group-hover:text-white transition-all">
                                                    <step.icon size={22} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="text-[12px] font-black text-[#093FB4] uppercase tracking-widest">Step {i + 1}</span>
                                                    <p className="text-[17px] font-black text-slate-900 mt-0.5">{step.label}</p>
                                                    <p className="text-[15px] text-slate-500 mt-1 leading-relaxed font-medium">{step.desc}</p>
                                                </div>
                                            </div>
                                        </ScrollReveal>
                                    ))}
                                </div>
                                <ScrollReveal delay={400}>
                                    <button
                                        onClick={() => navigate('/student-register')}
                                        className="mt-7 px-8 py-4 bg-[#093FB4] text-white text-[13px] font-black uppercase tracking-widest rounded-xl hover:bg-[#0731a8] transition-all flex items-center gap-2.5 group shadow-lg shadow-[#093FB4]/20"
                                    >
                                        Register as Student <ArrowRight size={17} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </ScrollReveal>
                            </div>

                            <div>
                                <ScrollReveal>
                                    <div className="flex items-center gap-3 mb-9">
                                        <span className="px-5 py-2 bg-[#FF1E1E] text-white text-[12px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF1E1E]/20">
                                            For Providers
                                        </span>
                                    </div>
                                </ScrollReveal>
                                <div className="space-y-5">
                                    {PROVIDER_STEPS.map((step, i) => (
                                        <ScrollReveal key={i} delay={i * 80}>
                                            <div className="flex items-start gap-5 p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#093FB4]/40 hover:shadow-lg transition-all duration-300 group">
                                                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-[#093FB4]/10 text-[#093FB4] group-hover:bg-[#093FB4] group-hover:text-white transition-all">
                                                    <step.icon size={22} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <span className="text-[12px] font-black text-[#093FB4] uppercase tracking-widest">Step {i + 1}</span>
                                                    <p className="text-[17px] font-black text-slate-900 mt-0.5">{step.label}</p>
                                                    <p className="text-[15px] text-slate-500 mt-1 leading-relaxed font-medium">{step.desc}</p>
                                                </div>
                                            </div>
                                        </ScrollReveal>
                                    ))}
                                </div>
                                <ScrollReveal delay={400}>
                                    <button
                                        onClick={() => navigate('/organization-register')}
                                        className="mt-7 px-8 py-4 bg-[#FF1E1E] text-white text-[13px] font-black uppercase tracking-widest rounded-xl hover:bg-[#d91a1a] transition-all flex items-center gap-2.5 group shadow-lg shadow-[#FF1E1E]/20"
                                    >
                                        Register as Provider <ArrowRight size={17} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 4 — FAQs ── */}
                <section id="faqs" className="bg-white py-28 px-8">
                    <div className="max-w-4xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16 space-y-4">
                                <span className="text-[#093FB4] text-[12px] font-black uppercase tracking-[0.5em]">Got Questions?</span>
                                <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase">
                                    Frequently Asked <span className="text-[#093FB4]">Questions</span>
                                </h3>
                                <p className="text-slate-500 font-semibold text-base max-w-xl mx-auto leading-relaxed">
                                    Everything you need to know about KyusISKO, scholarships, and how to get started.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="space-y-3">
                            {FAQS.map((faq, i) => (
                                <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
                            ))}
                        </div>

                        <ScrollReveal delay={400}>
                            <div className="text-center mt-14">
                                <p className="text-slate-500 text-[15px] font-semibold mb-5">Still have questions?</p>
                                <button
                                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-9 py-4 border-2 border-[#093FB4] text-[#093FB4] text-[13px] font-black uppercase tracking-widest rounded-xl hover:bg-[#093FB4] hover:text-white transition-all"
                                >
                                    Contact Us
                                </button>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* ── SECTION 5 — ABOUT US ── */}
                <section id="about" className="relative py-32 px-8" style={{ backgroundColor: '#FFFCFB' }}>
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <ScrollReveal>
                                <div className="space-y-7">
                                    <span className="text-[#093FB4] text-[12px] font-black uppercase tracking-[0.5em]">The Mission</span>
                                    <h4 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase">
                                        About Kyus<span className="text-[#093FB4]">ISKO</span>
                                    </h4>
                                    <p className="text-[17px] text-slate-600 leading-relaxed font-medium">
                                        KyusISKO is a platform that helps students find seamlessly and discover College Scholarships across Quezon City.
                                        Our mission is to bridge the gap between financial constraints and educational dreams through technology.
                                    </p>
                                    <p className="text-[17px] text-slate-600 leading-relaxed font-medium">
                                        We partner with government agencies, private corporations, and foundations to ensure every deserving student
                                        has access to funding opportunities — all in one place, completely free.
                                    </p>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={150}>
                                <div className="relative aspect-[4/3] lg:aspect-[5/4] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-white group cursor-pointer mt-4 lg:mt-0">
                                    <img
                                        src="/isko2.png"
                                        alt="Success"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-[#093FB4]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>

            </main>

            {/* ── FOOTER ── */}
            <footer id="contact" className="relative z-10 bg-slate-900 border-t border-slate-800 py-12 px-10">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12 mb-10">
                        <div className="space-y-4">
                            {/* 1. Increased Logo Size */}
                            <img src="/logo.png" alt="Logo" className="h-16 w-auto brightness-0 invert opacity-70" />
                            <p className="text-[13px] text-slate-400 font-semibold uppercase tracking-widest leading-relaxed max-w-[200px]">
                                Empowering QC students through scholarship access.
                            </p>
                        </div>

                        <div>
                            <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] mb-5">Quick Links</p>
                            <div className="space-y-3">
                                {/* 2. Active Routing/Scrolling for Quick Links */}
                                <p onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-[15px] text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold">
                                    About Us
                                </p>
                                <p onClick={() => navigate('/scholarships')} className="text-[15px] text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold">
                                    Scholarships
                                </p>
                                <p onClick={() => navigate('/provider-guidelines')} className="text-[15px] text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold">
                                    Provider Guidelines
                                </p>
                               
                            </div>
                        </div>

                        <div>
                            <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] mb-5">Contact Us</p>
                            <div className="space-y-4">
                                {/* 3. Removed click/hover events from email */}
                                <div className="flex items-center gap-3 text-[15px] font-semibold text-slate-400">
                                    <Mail size={16} className="text-[#4d7fff]" /> kyusisko.ph@gmail.com
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-7 flex flex-col md:flex-row justify-center items-center gap-3">
                        {/* 4. Removed "Made with <3" and centered copyright */}
                        <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest text-center">© 2026 KyusISKO Platform. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
