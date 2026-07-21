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
  UserCheck,
  Mail, 
  MapPin, 
  Globe, 
  Lightbulb, 
  Users, 
  FileCheck, 
  ArrowRight,
  Shield
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
    <div className="min-h-screen bg-slate-50 font-['Inter'] pb-20 relative">
      
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

      <main className="max-w-5xl mx-auto px-6 pt-12 relative z-10">
        
        {/* Welcome Section */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black text-[#093fb4] mb-4">Welcome to KyusISKO!</h2>
            <p className="text-slate-600 font-medium leading-relaxed text-sm">
              Thank you for your interest in becoming a scholarship provider in KyusISKO. 
              To maintain a secure, reliable, and student-friendly platform, all organizations, 
              institutions, and sponsors registering in the system must comply with the following 
              guidelines and requirements.
            </p>
          </div>
          {/* Simulated Graphic Representation */}
          <div className="hidden md:flex relative w-48 h-40 items-center justify-center">
            <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-2xl"></div>
            <ClipboardList size={100} className="text-blue-500 relative z-10" strokeWidth={1} />
            <div className="absolute -bottom-2 -left-4 bg-[#093fb4] rounded-xl p-3 z-20 shadow-lg">
              <Shield size={32} className="text-white" fill="currentColor" />
            </div>
            <div className="absolute top-4 -right-4 bg-teal-50 rounded-xl p-3 z-0 shadow-sm opacity-80">
               <Building2 size={40} className="text-teal-500" strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* 1. Registration Requirements */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-blue-200 w-16 md:w-32"></div>
            <h3 className="text-[#093fb4] font-black uppercase tracking-wider text-sm text-center">
              Provider Registration Requirements
            </h3>
            <div className="h-px bg-blue-200 w-16 md:w-32"></div>
          </div>
          <p className="text-center font-medium text-slate-500 text-sm mb-8">
            To register your onboarding profile proposal within the platform, the system collects<br className="hidden md:block" /> the following core identification details:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Item 1 */}
            <div className="border border-slate-100 shadow-sm rounded-2xl p-6 flex gap-4 bg-white items-start hover:shadow-md transition-shadow">
              <div className="text-green-500 bg-green-50 p-3 rounded-full shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">1</span>
                  <h4 className="font-bold text-slate-800 text-sm">Organization / Institution Identity Name</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">The official name of your organization or institution as registered.</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="border border-slate-100 shadow-sm rounded-2xl p-6 flex gap-4 bg-white items-start hover:shadow-md transition-shadow">
              <div className="text-green-500 bg-green-50 p-3 rounded-full shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">2</span>
                  <h4 className="font-bold text-slate-800 text-sm">Valid Classification Type</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">Select the appropriate classification that best describes your organization.</p>
                <div className="flex flex-wrap gap-2">
                  {['Government', 'Private', 'Corporate', 'NGO', 'Individual', 'Institution'].map(type => (
                    <span key={type} className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-bold">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="border border-slate-100 shadow-sm rounded-2xl p-6 flex gap-4 bg-white items-start hover:shadow-md transition-shadow">
              <div className="text-green-500 bg-green-50 p-3 rounded-full shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">3</span>
                  <h4 className="font-bold text-slate-800 text-sm">Official Coordinator Email Address & Contact Number</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">The active email address and contact number of the official coordinator handling the scholarship programs.</p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="border border-slate-100 shadow-sm rounded-2xl p-6 flex gap-4 bg-white items-start hover:shadow-md transition-shadow">
              <div className="text-green-500 bg-green-50 p-3 rounded-full shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">4</span>
                  <h4 className="font-bold text-slate-800 text-sm">Operational Business Location or Office Address</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">The physical location of your organization or main office.</p>
              </div>
            </div>

            {/* Item 5 */}
            <div className="border border-slate-100 shadow-sm rounded-2xl p-6 flex gap-4 bg-white items-start hover:shadow-md transition-shadow">
              <div className="text-green-500 bg-green-50 p-3 rounded-full shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">5</span>
                  <h4 className="font-bold text-slate-800 text-sm">Official Website or Public Social Media Profile Link</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">A valid website URL or public social media link for verification and reference.</p>
              </div>
            </div>

            {/* Item 6 */}
            <div className="border border-slate-100 shadow-sm rounded-2xl p-6 flex gap-4 bg-white items-start hover:shadow-md transition-shadow">
              <div className="text-green-500 bg-green-50 p-3 rounded-full shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">6</span>
                  <h4 className="font-bold text-slate-800 text-sm">Generic Provider Guidelines and Baseline Eligibility Criteria</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Submit your organization's general guidelines and baseline criteria for scholarships.</p>
              </div>
            </div>
          </div>

          {/* Important Reminder */}
          <div className="bg-[#fffdf5] border border-amber-100/60 rounded-2xl p-6 flex gap-4 items-start mb-12 shadow-sm">
            <Lightbulb size={24} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-700 font-bold text-sm mb-1.5">Important Reminder</h4>
              <p className="text-amber-700/80 font-medium text-xs leading-relaxed">
                All information provided will be reviewed and verified by the KyusISKO Admin Team. 
                Inaccurate or incomplete information may result in delays in your registration approval.
              </p>
            </div>
          </div>

          {/* Additional Guidelines Header */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px bg-blue-200 w-16 md:w-32"></div>
            <h3 className="text-[#093fb4] font-black uppercase tracking-wider text-sm text-center">
              Additional Guidelines
            </h3>
            <div className="h-px bg-blue-200 w-16 md:w-32"></div>
          </div>

          {/* Additional Guidelines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            <div className="bg-white border border-slate-100 rounded-2xl text-center p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto bg-blue-50 text-blue-600 p-3 rounded-full w-fit mb-4">
                <ShieldCheck size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Accuracy & Integrity</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Provide accurate and up-to-date information at all times.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl text-center p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto bg-blue-50 text-blue-600 p-3 rounded-full w-fit mb-4">
                <Lock size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Data Privacy</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">All submitted data will be handled with strict confidentiality.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl text-center p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto bg-blue-50 text-blue-600 p-3 rounded-full w-fit mb-4">
                <Users size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Student-Centered</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Ensure that all programs promote fairness, inclusion, and equal opportunity.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl text-center p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mx-auto bg-blue-50 text-blue-600 p-3 rounded-full w-fit mb-4">
                <FileCheck size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Compliance</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Follow all platform policies and regulatory requirements.</p>
            </div>
          </div>
        </div>

        {/* Restored Original Guidelines Sections */}
        <div className="max-w-4xl mx-auto">
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
                "Misuse uploaded student documents or personal information"
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
        </div>

        {/* Bottom CTA Block */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mt-12 mb-8 border border-slate-200 shadow-sm relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-[#093fb4] p-3 rounded-2xl shrink-0 relative">
              <Building2 size={28} strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <CheckCircle size={14} className="text-green-500" fill="currentColor" />
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg mb-1 tracking-tight">Ready to Get Started?</h4>
              <p className="text-xs font-medium text-slate-500 max-w-sm leading-relaxed">
                Make sure you have all the required information ready before proceeding with your registration. By continuing, you agree to these platform guidelines.
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/organization-register')}
            className="w-full md:w-auto px-8 py-3.5 bg-[#093fb4] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#07308a] transition-all shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Continue to Registration <ArrowRight size={18} />
          </button>
        </div>

        {/* Support Contact */}
        <div className="text-center relative z-10 mt-8">
          <p className="text-xs font-medium text-slate-500">
            For questions or assistance, please contact us at{' '}
            <a href="kyusisko.ph@gmail.com" className="text-[#093fb4] font-bold hover:underline">
              kyusisko.ph@gmail.com
            </a>
          </p>
        </div>

      </main>
    </div>
  );
}