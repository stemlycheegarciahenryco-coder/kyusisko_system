import React from 'react';
import { 
  ShieldCheck, 
  ClipboardList, 
  AlertCircle, 
  Lock, 
  CheckCircle, 
  ArrowLeft,
  Building2,
  FileText,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuidelineSection = ({ icon: Icon, title, children }) => (
  <section className="mb-12 relative z-10">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-blue-50 rounded-2xl text-[#093fb4]">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
        {title}
      </h2>
    </div>
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
      {children}
    </div>
  </section>
);

export default function ProviderGuidelines() {
  const navigate = useNavigate();

  return (
    /* The absolute pseudo-elements here safely render your bg2.png image at 50% opacity
       without affecting the layout properties or muddying text layers.
    */
    <div className="min-h-screen bg-slate-50 font-['Inter'] pb-20 relative">

  {/* Fixed full-screen background image */}
  <div
  className="fixed inset-0 pointer-events-none"
  style={{
    backgroundImage: "url('/bg2.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: 0.8,  // 👈 lower this — 0.1 to 0.2 is ideal for busy images
    zIndex: 0,
  }}
/>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-[#093fb4] font-bold text-sm transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          {/* Centered Logo & Text Group */}
          <div className="flex flex-col items-center text-center">
            <img 
              src="/logo.png" 
              alt="KyusISKO Logo" 
              className="h-9 w-auto object-contain mb-1.5" 
            />
            <span className="text-[9px] font-black text-[#093fb4] uppercase tracking-[0.2em] block mb-0.5">
              KyusISKO Platform
            </span>
            <h1 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">
              Scholarship Provider Guidelines
            </h1>
          </div>
          
          <div className="w-16" /> {/* Spacer for keeping layout centered */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12 relative z-10">
        {/* Intro */}
        <div className="text-center mb-16">
          <h3 className="text-slate-700 font-medium leading-relaxed max-w-3xl mx-auto text-base
                bg-white rounded-2xl px-8 py-5 shadow-sm border border-slate-100">
            Thank you for your interest in becoming a scholarship provider in KyusISKO. To maintain a secure,
            reliable, and student-friendly platform, all organizations, institutions, and sponsors registering in
            the system must comply with the following guidelines and requirements.
          </h3>
        </div>

        {/* 1. Registration Requirements */}
        <GuidelineSection icon={Building2} title="Provider Registration Requirements">
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">
            To verify the legitimacy and credibility of scholarship providers, the following information and
            documents may be required during registration:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              "Organization or Institution Name",
              "Official Email Address and Contact Number",
              "Office Address or Business Location",
              "Valid Identification of Authorized Representative",
              "Proof of Organization Legitimacy (e.g., business permit, school certification, SEC registration, government accreditation, or related supporting documents)",
              "Scholarship Program Details and Eligibility Requirements"
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-700 leading-relaxed">
                <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" /> 
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium text-slate-500 bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 leading-relaxed">
            These requirements are collected to ensure that only verified and legitimate scholarship providers
            are allowed to post opportunities within the platform. This process helps protect students from
            fraudulent, misleading, or unauthorized scholarship postings.
          </p>
        </GuidelineSection>

        {/* 2. Posting Guidelines */}
        <GuidelineSection icon={ClipboardList} title="Scholarship Posting Guidelines">
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">
            All scholarship providers must ensure that the information they post is accurate, complete, and up
            to date. Scholarship postings must include:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              "Scholarship title and description", 
              "Eligibility requirements", 
              "Required documents", 
              "Application deadlines", 
              "Scholarship benefits or coverage", 
              "Official application process or instructions"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-center p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs font-bold text-[#093fb4] uppercase tracking-wide text-center">
                {item}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
            Providers must ensure that scholarship opportunities are intended for educational purposes and
            comply with applicable laws and ethical standards.
          </p>
        </GuidelineSection>

        {/* 3. Prohibited Activities */}
        <GuidelineSection icon={AlertCircle} title="Prohibited Activities">
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">
            The following activities are strictly prohibited within the platform:
          </p>
          <div className="space-y-4 mb-6">
            {[
              "Posting fake, misleading, or incomplete scholarship opportunities",
              "Requesting unnecessary sensitive personal information from students",
              "Asking students for application fees, payments, or financial transactions without proper disclosure and authorization",
              "Posting advertisements, spam, or unrelated promotional content",
              "Using the system for unauthorized data collection or non-educational purposes"
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-red-50/80 border border-red-100 rounded-2xl group">
                <div className="w-2 h-2 rounded-full bg-red-400 group-hover:scale-125 transition-transform shrink-0 mt-2" />
                <span className="text-sm font-bold text-red-700 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
            KyusISKO reserves the right to review, reject, suspend, or remove scholarship postings and provider
            accounts that violate these policies.
          </p>
        </GuidelineSection>

        {/* 4. Privacy and Data Protection */}
        <GuidelineSection icon={Lock} title="Privacy and Data Protection">
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">
            Scholarship providers are expected to handle student information responsibly and confidentially.
            Any student data accessed through the system must only be used for scholarship-related
            evaluation and communication.
          </p>
          <div className="space-y-3 mb-6">
            <p className="text-sm font-black text-slate-700 uppercase tracking-wide">Providers must not:</p>
            {[
              "Share student information with unauthorized third parties",
              "Use student data for commercial or unrelated purposes",
              "Misuse uploaded documents or personal information"
            ].map((text, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-center">
                <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                <p className="text-sm font-bold text-slate-700">
                  {text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
            KyusISKO implements reasonable security measures to help protect user data; however, providers
            are also responsible for maintaining proper confidentiality and ethical use of information.
          </p>
        </GuidelineSection>

        {/* 5. Verification and Approval */}
        <GuidelineSection icon={UserCheck} title="Verification and Approval">
          <p className="text-slate-600 mb-4 font-medium leading-relaxed">
            All provider registrations and scholarship postings are subject to review and approval by the system
            administrators before becoming publicly accessible within the platform.
          </p>
          <div className="space-y-3">
            <p className="text-sm font-black text-slate-700 uppercase tracking-wide">The review process helps ensure:</p>
            {[
              "Legitimacy of scholarship providers",
              "Accuracy of posted information",
              "Safety and reliability for student users"
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-slate-600 pl-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#093fb4]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </GuidelineSection>

        {/* 6. Approval & Acceptance */}
        <div className="bg-[#093fb4]/95 backdrop-blur-sm rounded-[40px] p-10 text-center text-white shadow-2xl shadow-blue-900/20 relative z-10">
          <FileText size={48} className="mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">Acceptance of Guidelines</h2>
          <p className="text-blue-100 text-sm font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
            By registering and using KyusISKO as a scholarship provider, organizations and sponsors
            acknowledge that they have read, understood, and agreed to comply with these Scholarship
            Provider Guidelines and platform policies.
          </p>
          <button 
            onClick={() => navigate('/organization-register')}
            className="px-10 py-4 bg-white text-[#093fb4] font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-[#FF1E1E] hover:text-white transition-all shadow-lg relative z-20"
          >
            Acknowledge & Register
          </button>
        </div>
      </main>
    </div>
  );
}