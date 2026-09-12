import React, { useState, useEffect } from 'react';
import { 
  IconBuildingCommunity, IconMail, IconArrowLeft, IconWorld, IconMapPin, IconFileText, IconPhone
} from '@tabler/icons-react';
import { useOrganization } from './useOrganization';
import { OrgSuccessModal, OtpModal, ErrorModal } from './component/RegisterModals';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './component/LoadingScreen';

const OrganizationRegisterPage = () => {
  const navigate = useNavigate();
  const { 
    formData, setFormData, handleOnboard, 
    handleRequestOtp, handleVerifyOtp, 
    loading, verifying 
  } = useOrganization();

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [activeRegionCode, setActiveRegionCode] = useState('');
  const [activeCityCode, setActiveCityCode] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch location API profiles
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/regions/')
      .then(res => res.json())
      .then(data => setRegions(data.sort((a, b) => a.name.localeCompare(b.name))));
  }, []);

  useEffect(() => {
    if (activeRegionCode) {
      fetch(`https://psgc.gitlab.io/api/regions/${activeRegionCode}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => setCities(data.sort((a, b) => a.name.localeCompare(b.name))));
    }
  }, [activeRegionCode]);

  useEffect(() => {
    if (activeCityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${activeCityCode}/barangays/`)
        .then(res => res.json())
        .then(data => setBarangays(data.sort((a, b) => a.name.localeCompare(b.name))));
    }
  }, [activeCityCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact_number") {
      const numbersOnly = value.replace(/[^0-9]/g, "");
      if (numbersOnly.length > 0 && numbersOnly[0] !== '9') return;
      if (numbersOnly.length > 10) return;
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      return;
    }

    if (name === "tel_number") {
      const numbersOnly = value.replace(/[^0-9]/g, "");
      if (numbersOnly.length > 10) return; // Standard PH Landline length safeguard
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      return;
    }

    if (name === "region") {
      const selected = regions.find(r => r.code === value);
      setActiveRegionCode(value);
      setFormData(prev => ({ ...prev, region: selected?.name || '', city: '', barangay: '' }));
      setCities([]);
      setBarangays([]);
      setActiveCityCode('');
      return;
    }
    if (name === "city") {
      const selected = cities.find(c => c.code === value);
      setActiveCityCode(value);
      setFormData(prev => ({ ...prev, city: selected?.name || '', barangay: '' }));
      setBarangays([]);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    const res = await handleRequestOtp();
    if (res.success) setShowOtpModal(true);
    else { setErrorMessage(res.error); setShowError(true); }
  };

  const handleOtpVerified = async (otp) => {
    const res = await handleVerifyOtp(otp);
    if (res.success) {
      setShowOtpModal(false);
      const onboardRes = await handleOnboard();
      if (onboardRes.success) setShowSuccess(true);
      else { setErrorMessage(onboardRes.error); setShowError(true); }
    } else {
      setErrorMessage("Invalid OTP Code");
      setShowError(true);
    }
  };

  const isFormInvalid = (() => {
    const requiredFields = [
      "org_name", "provider_type", "sub_email", "contact_number", 
      "region", "city", "barangay", "street_address"
    ];
    
    const allRequiredFilled = requiredFields.every(field => {
      const val = formData[field];
      return val && String(val).trim() !== "";
    });

    const isContactValid = formData.contact_number?.length === 10;
    return !allRequiredFilled || !isContactValid;
  })();

  return (
    <div
      className="min-h-screen w-full flex items-start justify-center py-10 px-4 relative font-['Inter']"
      style={{
        backgroundImage: "url('/memorial.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* REUSABLE LOADING SCREEN */}
      <LoadingScreen isLoading={loading || verifying} />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-md hover:bg-white/20 px-5 py-3 rounded-2xl border border-white/20 transition-all shadow-lg active:scale-95"
      >
        <IconArrowLeft size={18} stroke={2.5} /> Back
      </button>

      {/* Glass Form Card - Matched to LogIn.jsx container style */}
      <div className="relative z-10 w-full max-w-3xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl px-8 py-10 md:px-12 md:py-12 mt-4">

        {/* Logo + Title - Matched to LogIn.jsx header style */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain drop-shadow-lg" />
          </div>
          <p className="mt-2 text-sm font-black text-slate-700 uppercase tracking-[0.3em]">
            Provider Registration
          </p>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-6">

          {/* SECTION: Institution Profile Identity */}
          <SectionLabel label="Account Identity" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Organization / Institution Name" required>
              <div className="relative group">
                <IconBuildingCommunity className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                <input required name="org_name" value={formData.org_name} onChange={handleChange}
                  className={`${inputCls} pl-12`} placeholder="e.g. KyusIsko Foundation" />
              </div>
            </Field>
            
            <Field label="Provider Type" required>
              <select required name="provider_type" value={formData.provider_type} onChange={handleChange} className={`${inputCls} px-4`}>
                <option value="">Select Type</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Corporate">Corporate</option>
                <option value="NGO">Non Government Organization</option>
                <option value="Individual Provider">Individual Provider</option>
                <option value="Institution">Institution</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Organization / Coordinator Email" required>
              <div className="relative group">
                <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                <input required name="sub_email" type="email" value={formData.sub_email} onChange={handleChange}
                  className={`${inputCls} pl-12`} placeholder="org@domain.com" />
              </div>
            </Field>

            <Field label="Mobile Number" required>
              <div className="relative group flex items-center">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-black/15 pr-3 h-6">
                  <img src="/ph.svg" alt="PH" className="w-5 h-3 object-contain" />
                  <span className="text-xs font-bold text-black/60 group-focus-within:text-[#093fb4] transition-colors">+63</span>
                </div>
                <input type="text" required name="contact_number" placeholder="9XXXXXXXXX"
                  value={formData.contact_number} onChange={handleChange}
                  className={`${inputCls} pl-[6.5rem]`} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Telephone Number (Landline)">
              <div className="relative group">
                <IconPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                <input type="text" name="tel_number" placeholder="e.g. 0281234567"
                  value={formData.tel_number || ""} onChange={handleChange}
                  className={`${inputCls} pl-12`} />
              </div>
            </Field>

            <Field label="Website / Social Media Page">
              <div className="relative group">
                <IconWorld className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
                <input name="website" value={formData.website} onChange={handleChange}
                  className={`${inputCls} pl-12`} placeholder="https://your-institution.org or Facebook" />
              </div>
            </Field>
          </div>

          {/* SECTION: Address */}
          <SectionLabel label="Provider Address" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Region" required>
              <select required name="region" value={activeRegionCode} onChange={handleChange} className={`${inputCls} px-4`}>
                <option value="">Select Region</option>
                {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </Field>
            
            <Field label="City / Municipality" required>
              <select required name="city" value={activeCityCode} onChange={handleChange}
                disabled={!activeRegionCode} className={`${inputCls} px-4`}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
            
            <Field label="Barangay" required>
              <select required name="barangay" value={formData.barangay} onChange={handleChange}
                disabled={!activeCityCode} className={`${inputCls} px-4`}>
                <option value="">Select Barangay</option>
                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </Field>
          </div>
          
          <Field label="Street Address / Building / Office No." required>
            <div className="relative group">
              <IconMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-[#093fb4] transition-colors" size={20} />
              <input required name="street_address" value={formData.street_address} onChange={handleChange}
                className={`${inputCls} pl-12`} placeholder="Unit No., Street name, Building location" />
            </div>
          </Field>

          {/* Guidelines Block */}
          <div className="pt-4 flex flex-col items-center justify-center gap-1.5 bg-white/40 border-2 border-white/60 backdrop-blur-sm rounded-2xl p-5 text-center shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-[0.2em]">
              <IconFileText size={18} className="text-[#093fb4]" />
              Registration Terms
            </div>
            <p className="text-xs font-bold text-slate-600 max-w-md my-1 leading-relaxed">
              By submitting this application, you agree to comply with our platform policies.
            </p>
            <button
              type="button"
              onClick={() => navigate('/provider-guidelines')}
              className="text-xs font-black text-[#093fb4] hover:text-[#FF1E1E] transition-colors uppercase tracking-[0.1em] mt-1"
            >
              Read Scholarship Provider Guidelines
            </button>
          </div>

          {/* Submit Action Button - Matched to LogIn.jsx */}
          <button
            type="submit"
            disabled={isFormInvalid || loading || verifying}
            className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 disabled:active:scale-100 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] mt-8"
          >
            {loading || verifying ? "Processing Onboarding..." : "Submit Registration "}
          </button>
        </form>
      </div>

      <OtpModal isOpen={showOtpModal} email={formData.sub_email} onVerify={handleOtpVerified} onCancel={() => setShowOtpModal(false)} />
      <ErrorModal isOpen={showError} onClose={() => setShowError(false)} message={errorMessage} />
      <OrgSuccessModal isOpen={showSuccess} message="Registration Submitted! Awaiting Admin verification." onConfirm={() => navigate('/')} />
    </div>
  );
};

// Base Input Class applied consistently across all inputs to match LogIn.jsx styling
const inputCls = "w-full pr-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-sm shadow-sm";

function Field({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-800 uppercase ml-1 tracking-wider block">
        {label}{required && <span className="text-[#FF1E1E] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-4 pt-6 pb-2">
      <div className="h-[2px] flex-1 bg-black/5 rounded-full" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
      <div className="h-[2px] flex-1 bg-black/5 rounded-full" />
    </div>
  );
}

export default OrganizationRegisterPage;