import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Mail,
  Phone,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Search,
  Send,
  BookOpen,
  Building2,
  FileCheck,
  BadgeCheck,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import HomeNav from './HomeNav';

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
      className={`transition-all duration-1000 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
};

/* ─── Upgraded Mock Scholarship Data ────────────────────────── */
const SCHOLARSHIPS = [
  {
    id: 1,
    title: 'QC Financial Assistance for Tertiary Education',
    provider: 'QC Government',
    coverage: '₱25,000 per Semester',
    criteria: 'QC Resident & GWA of 2.0 or higher',
    deadline: 'June 15, 2026',
    tag: 'Local Gov',
    img: '/org1.png'
  },
  {
    id: 2,
    title: 'DOST-SEI Merit Scholarship Program',
    provider: 'Department of Science and Technology',
    coverage: 'Full Tuition + ₱7,000/mo Stipend',
    criteria: 'STEM Strand or Top 5% of Non-STEM',
    deadline: 'May 30, 2026',
    tag: 'Science & Tech',
    img: '/org2.png'
  },
  {
    id: 3,
    title: 'CHED Tertiary Education Subsidy (TES)',
    provider: 'CHED UniFAST',
    coverage: '₱40,000 per Academic Year',
    criteria: 'Parihas/Listahanan or Low Income Bracket',
    deadline: 'July 10, 2026',
    tag: 'National Gov',
    img: '/org3.png'
  },
  {
    id: 4,
    title: 'SM Foundation College Scholarship',
    provider: 'SM Foundation',
    coverage: 'Full Tuition + Monthly Allowance',
    criteria: 'Max Gross Family Income < ₱250k/yr',
    deadline: 'June 01, 2026',
    tag: 'Private',
    img: '/org4.png'
  },
  {
    id: 5,
    title: 'Ayala Foundation Education Grant',
    provider: 'Ayala Foundation',
    coverage: '₱30,000 Annual Allowance + Laptop',
    criteria: 'Regular 2nd Year College Students',
    deadline: 'June 20, 2026',
    tag: 'Corporate',
    img: '/org5.png'
  },
  {
    id: 6,
    title: 'TESDA Training for Work Scholarship',
    provider: 'TESDA',
    coverage: 'Free Training + Assessment Fee',
    criteria: 'At least 18 y/o & Tech-Voc Student',
    deadline: 'Ongoing Admission',
    tag: 'Technical',
    img: '/org6.png'
  },
];

/* ─── Upgraded Scholarship Carousel ─────────────────────────── */
const ScholarshipCarousel = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const visible = 3;
  const total = SCHOLARSHIPS.length;
  const intervalRef = useRef();

  const next = () => setCurrent(p => (p + 1) % total);
  const prev = () => setCurrent(p => (p - 1 + total) % total);

  useEffect(() => {
    intervalRef.current = setInterval(next, 5000); // 5s read time for textual data
    return () => clearInterval(intervalRef.current);
  }, []);

  const getSlice = () => {
    const items = [];
    for (let i = 0; i < visible; i++) {
      items.push(SCHOLARSHIPS[(current + i) % total]);
    }
    return items;
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getSlice().map((program, i) => (
          <div
            key ={program.id + '-' + i}
            className="bg-white rounded-2xl border border-slate-100 shadow-lg flex flex-col justify-between overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Header Content Top */}
            <div>
              {/* Media Container with Dynamic Fallback Overlay */}
              <div className="h-32 bg-slate-50 flex items-center justify-center overflow-hidden relative border-b border-slate-50">
                <img
                  src={program.img}
                  alt={program.provider}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="hidden w-full h-full absolute inset-0 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <Building2 size={40} className="text-[#093FB4]/30" strokeWidth={1.5} />
                </div>
                {/* Custom Label Category Pill Tag */}
                <div className="absolute top-4 left-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white bg-[#093FB4] shadow-md px-2.5 py-1 rounded-md">
                    {program.tag}
                  </span>
                </div>
              </div>

              {/* Text Core Content details body info elements */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide truncate mb-0.5">
                    {program.provider}
                  </p>
                  <h4 className="text-[16px] font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#093FB4] transition-colors h-12">
                    {program.title}
                  </h4>
                </div>

                <hr className="border-slate-100" />

                {/* Info specifications breakdown blocks section */}
                <div className="space-y-2.5 text-[12px] font-medium text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={12} strokeWidth={2.5} />
                    </div>
                    <span className="truncate"><strong>Coverage:</strong> {program.coverage}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded bg-blue-50 text-[#093FB4] flex items-center justify-center flex-shrink-0">
                      <Layers size={12} strokeWidth={2.5} />
                    </div>
                    <span className="truncate"><strong>Criteria:</strong> {program.criteria}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded bg-red-50 text-[#FF1E1E] flex items-center justify-center flex-shrink-0">
                      <Calendar size={12} strokeWidth={2.5} />
                    </div>
                    <span><strong>Deadline:</strong> <span className="text-red-600 font-bold">{program.deadline}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Direct Prompt Footer Block Action */}
            <div className="p-6 pt-0">
              <button
                onClick={() => navigate('/student-login')}
                className="w-full py-2.5 bg-slate-50 border border-slate-100 group-hover:bg-[#093FB4] group-hover:text-white group-hover:border-[#093FB4] rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-700 transition-all flex items-center justify-center gap-2"
              >
                Apply Now <ArrowRight size={13} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Control Dots Slider Navigation Layout links panel bar */}
      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          onClick={prev}
          className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-[#093FB4] hover:text-white hover:border-[#093FB4] transition-all shadow"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex gap-2">
          {SCHOLARSHIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-7 bg-[#093FB4]' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-[#093FB4] hover:text-white hover:border-[#093FB4] transition-all shadow"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

/* ─── Steps data ─────────────────────────────────────────────── */
const STUDENT_STEPS = [
  { icon: UserPlus,   label: 'Create Account',      desc: 'Sign up for free with your student email and basic personal information.' },
  { icon: Search,     label: 'Browse Scholarships',  desc: 'Explore verified scholarships filtered by your course, year level, and financial need.' },
  { icon: FileCheck,  label: 'Submit Application',   desc: 'Upload your requirements and apply directly through the platform — no extra steps.' },
  { icon: BadgeCheck, label: 'Get Notified',         desc: 'Track your application status in real-time and receive updates instantly.' },
];

const PROVIDER_STEPS = [
  { icon: Building2, label: 'Register Organization', desc: 'Create a verified provider account for your institution or organization.' },
  { icon: BookOpen,  label: 'Post Scholarships',     desc: 'Publish your scholarship programs with full details, requirements, and available slots.' },
  { icon: FileCheck, label: 'Review Applications',   desc: 'Manage and evaluate student submissions all in one organized dashboard.' },
  { icon: Send,      label: 'Award Scholars',        desc: 'Notify selected scholars and onboard them seamlessly through the platform.' },
];

/* ─── FAQ data ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Is KyusISKO free to use?',
    a: 'Yes, KyusISKO is completely free for all Quezon City college students. There are no hidden fees or premium tiers — just sign up and start applying.'
  },
  {
    q: 'Who can apply for scholarships on KyusISKO?',
    a: 'Any college student residing in or attending a college within Quezon City can register and apply. Some scholarships may have additional eligibility requirements set by the provider.'
  },
  {
    q: 'How do I know if a scholarship provider is legitimate?',
    a: 'All scholarship providers on KyusISKO go through a vetting and verification process before their listings are published. You will see a "Vetted Provider" badge on verified organizations.'
  },
  {
    q: 'Can I apply to multiple scholarships at the same time?',
    a: 'Yes! You can browse and apply to as many scholarships as you qualify for. Your dashboard lets you track all your applications in one place.'
  },
  {
    q: 'How do organizations partner with KyusISKO?',
    a: 'Organizations can register through the "Partner With Us" option in the navigation bar. After submitting your details, our team will review and approve your provider account.'
  },
  {
    q: 'How long does the application review take?',
    a: 'Review timelines vary per scholarship provider. Once your application is submitted, you will receive status updates directly on your KyusISKO dashboard and via email.'
  },
];

/* ─── FAQ Accordion Item ─────────────────────────────────────── */
const FAQItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <ScrollReveal delay={index * 60}>
      <div
        className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
          open ? 'border-[#093FB4] shadow-lg shadow-[#093FB4]/10' : 'border-slate-200 hover:border-[#093FB4]/40'
        }`}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-7 py-5 text-left bg-white group"
        >
          <span className={`text-[15px] font-black tracking-tight transition-colors ${open ? 'text-[#093FB4]' : 'text-slate-900 group-hover:text-[#093FB4]'}`}>
            {q}
          </span>
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`flex-shrink-0 ml-4 transition-all duration-300 ${open ? 'rotate-180 text-[#093FB4]' : 'text-slate-400'}`}
          />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-48' : 'max-h-0'}`}>
          <p className="px-7 pb-6 text-[14px] text-slate-600 leading-relaxed font-medium bg-white">
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
        <section className="relative w-full overflow-hidden">
          <img
            src="/circle.jpg"
            alt="QC Memorial Circle"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              minHeight: '100vh',
              objectFit: 'cover',
              objectPosition: 'center center',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%), linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 75%, transparent 100%)',
            }}
          />

          <div className="absolute inset-0 flex flex-col">
            <div className="w-full relative z-20">
              <HomeNav />
            </div>

            <div className="flex-grow flex items-start pt-4 lg:pt-8">
              <div className="w-full max-w-6xl mx-auto px-8 grid lg:grid-cols-2 gap-12 items-center py-12">
                <ScrollReveal>
                  <div className="space-y-7">
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-white/30">
                        <CheckCircle2 size={13} strokeWidth={3} /> 100% Free
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#093FB4]/80 backdrop-blur-sm text-white rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-[#093FB4]">
                        <Sparkles size={13} strokeWidth={3} className="text-blue-200" /> Vetted Scholarship Providers
                      </div>
                    </div>

                    <h2 className="text-6xl lg:text-8xl font-black leading-[0.92] tracking-tighter text-white drop-shadow-2xl">
                      Kyus<span className="text-[#4d7fff]">IS</span><span className="text-[#FF1E1E]">KO</span>
                      <br />
                      <span className="text-white text-4xl lg:text-5xl uppercase font-black">for College Students</span>
                    </h2>

                    <p className="text-base text-white/80 font-semibold max-w-sm leading-relaxed">
                      The premier scholarship discovery platform for Quezon City college students.
                      Find, apply, and get funded — all in one place.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <button
                        onClick={() => navigate('/student-register')}
                        className="px-9 py-4 bg-[#093FB4] text-white font-black rounded-xl shadow-2xl hover:bg-[#0731a8] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group text-[11px] uppercase tracking-[0.2em]"
                      >
                        Get Started <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                        onClick={() => document.getElementById('scholarships')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-9 py-4 bg-white/15 backdrop-blur-sm text-white font-black rounded-xl border border-white/40 hover:bg-white/25 transition-all text-[11px] uppercase tracking-[0.2em]"
                      >
                        Browse Scholarships
                      </button>
                    </div>
                  </div>
                </ScrollReveal>

                <div className="hidden lg:block relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-white/20 max-w-md mx-auto lg:ml-auto group cursor-pointer">
                  <img
                    src="/isko.png"
                    alt="Graduates"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[#093FB4]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 — UPDATED TO SCHOLARSHIP PROGRAMS ── */}
        <section id="scholarships" className="bg-white py-28 px-8">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16 space-y-4">
                <span className="text-[#FF1E1E] text-[10px] font-black uppercase tracking-[0.5em]">Active Openings</span>
                <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase">
                  Featured <span className="text-[#093FB4]">Scholarships</span>
                </h3>
                <p className="text-slate-500 font-semibold text-base max-w-xl mx-auto leading-relaxed">
                  Apply directly to open programs with verified coverage details and deadlines.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <ScholarshipCarousel />
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="text-center mt-12">
                <button
                  onClick={() => navigate('/scholarships')}
                  className="px-10 py-4 border-2 border-[#093FB4] text-[#093FB4] text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#093FB4] hover:text-white transition-all"
                >
                  View All Scholarships
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── SECTION 3 — HOW TO APPLY ── */}
        <section className="py-28 px-8 relative overflow-hidden" style={{ backgroundColor: '#FFFCFB' }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#093FB4]/6 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#FF1E1E]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <ScrollReveal>
              <div className="text-center mb-16 space-y-4">
                <span className="text-[#FF1E1E] text-[10px] font-black uppercase tracking-[0.5em]">Simple Process</span>
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
                    <span className="px-5 py-2 bg-[#093FB4] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#093FB4]/20">
                      For Students
                    </span>
                  </div>
                </ScrollReveal>
                <div className="space-y-5">
                  {STUDENT_STEPS.map((step, i) => (
                    <ScrollReveal key={i} delay={i * 80}>
                      <div className="flex items-start gap-5 p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#093FB4]/40 hover:shadow-lg transition-all duration-300 group">
                        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-[#093FB4]/10 text-[#093FB4] group-hover:bg-[#093FB4] group-hover:text-white transition-all">
                          <step.icon size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#093FB4] uppercase tracking-widest">Step {i + 1}</span>
                          <p className="text-[15px] font-black text-slate-900 mt-0.5">{step.label}</p>
                          <p className="text-[13px] text-slate-500 mt-1 leading-relaxed font-medium">{step.desc}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
                <ScrollReveal delay={400}>
                  <button
                    onClick={() => navigate('/student-register')}
                    className="mt-7 px-7 py-3.5 bg-[#093FB4] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#0731a8] transition-all flex items-center gap-2.5 group shadow-lg shadow-[#093FB4]/20"
                  >
                    Register as Student <ArrowRight size={15} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </ScrollReveal>
              </div>

              <div>
                <ScrollReveal>
                  <div className="flex items-center gap-3 mb-9">
                    <span className="px-5 py-2 bg-[#FF1E1E] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF1E1E]/20">
                      For Providers
                    </span>
                  </div>
                </ScrollReveal>
                <div className="space-y-5">
                  {PROVIDER_STEPS.map((step, i) => (
                    <ScrollReveal key={i} delay={i * 80}>
                      <div className="flex items-start gap-5 p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#FF1E1E]/40 hover:shadow-lg transition-all duration-300 group">
                        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-[#FF1E1E]/10 text-[#FF1E1E] group-hover:bg-[#FF1E1E] group-hover:text-white transition-all">
                          <step.icon size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#FF1E1E] uppercase tracking-widest">Step {i + 1}</span>
                          <p className="text-[15px] font-black text-slate-900 mt-0.5">{step.label}</p>
                          <p className="text-[13px] text-slate-500 mt-1 leading-relaxed font-medium">{step.desc}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
                <ScrollReveal delay={400}>
                  <button
                    onClick={() => navigate('/organization-register')}
                    className="mt-7 px-7 py-3.5 bg-[#FF1E1E] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#d91a1a] transition-all flex items-center gap-2.5 group shadow-lg shadow-[#FF1E1E]/20"
                  >
                    Register as Provider <ArrowRight size={15} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
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
                <span className="text-[#FF1E1E] text-[10px] font-black uppercase tracking-[0.5em]">Got Questions?</span>
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
                <p className="text-slate-500 text-[13px] font-semibold mb-5">Still have questions?</p>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3.5 border-2 border-[#093FB4] text-[#093FB4] text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#093FB4] hover:text-white transition-all"
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
                  <span className="text-[#FF1E1E] text-[10px] font-black uppercase tracking-[0.5em]">The Mission</span>
                  <h4 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase">
                    About Kyus<span className="text-[#093FB4]">ISKO</span>
                  </h4>
                  <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                    KyusISKO is a platform that helps students find seamlessly and discover College Scholarships across Quezon City.
                    Our mission is to bridge the gap between financial constraints and educational dreams through technology.
                  </p>
                  <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                    We partner with government agencies, private corporations, and foundations to ensure every deserving student
                    has access to funding opportunities — all in one place, completely free.
                  </p>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {[
                      { label: 'Scholarships',     value: '50+'    },
                      { label: 'Students Helped', value: '2,000+' },
                      { label: 'Partner Orgs',    value: '30+'    },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#093FB4]/5 border border-[#093FB4]/15 rounded-2xl p-5 text-center">
                        <p className="text-3xl font-black text-[#093FB4]">{stat.value}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-white group cursor-pointer">
                  <img
                    src="/isko2.png"
                    alt="Success"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
              <img src="/logo.png" alt="Logo" className="h-8 w-auto brightness-0 invert opacity-70" />
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest leading-relaxed max-w-[200px]">
                Empowering QC students through scholarship access.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-5">Quick Links</p>
              <div className="space-y-3">
                {['About Us', 'Scholarships', 'Provider Guidelines', 'Student Login'].map(link => (
                  <p key={link} className="text-[13px] text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold">
                    {link}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-5">Contact Us</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-400 hover:text-[#4d7fff] transition-colors cursor-pointer">
                  <Mail size={14} className="text-[#4d7fff]" /> support@kyusisko.ph
                </div>
                <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-400 hover:text-[#FF1E1E] transition-colors cursor-pointer">
                  <Phone size={14} className="text-[#FF1E1E]" /> +63 912 345 6789
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-7 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">© 2026 KyusISKO Platform. All rights reserved.</p>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Made with ❤ for QC Students</p>
          </div>
        </div>
      </footer>
    </div>
  );
}