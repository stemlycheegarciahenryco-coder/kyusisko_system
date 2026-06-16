import React, { useState, useEffect } from 'react';
import { 
  IconBuildingCommunity, IconMail, IconArrowLeft, IconWorld, IconMapPin, IconFileText, IconPhone
} from '@tabler/icons-react';
import { useOrganization } from './useOrganization';
import { OrgSuccessModal, OtpModal, ErrorModal } from './component/RegisterModals';
import { useNavigate } from 'react-router-dom';

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
      className="min-h-screen w-full flex items-start justify-center py-10 px-4 relative"
      style={{
        backgroundImage: "url('/memorial.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/15" />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-md hover:bg-white/20 px-4 py-2.5 rounded-full border border-white/20 transition-all"
      >
        <IconArrowLeft size={16} /> Back
      </button>

      {/* Glass Form Card */}
      <div className="relative z-10 w-full max-w-3xl bg-white/45 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl px-8 py-10 md:px-12 md:py-12">

        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Logo" className="h-20 mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-black text-black uppercase tracking-tight text-center">
            Scholarship Provider Registration
          </h1>
          <div className="h-1 w-16 bg-[#FF1E1E] mt-3 rounded-full" />
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-6">

          {/* SECTION: Institution Profile Identity */}
          <SectionLabel label="Institution Identity" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Organization / Institution Name" required>
              <div className="relative">
                <IconBuildingCommunity className="absolute left-3.5 top-3.5 text-black/60" size={18} />
                <input required name="org_name" value={formData.org_name} onChange={handleChange}
                  className={`${inputCls} pl-10`} placeholder="e.g. KyusIsko Foundation" />
              </div>
            </Field>
            
            <Field label="Provider Type" required>
              <select required name="provider_type" value={formData.provider_type} onChange={handleChange} className={inputCls}>
                <option value="">Select Type</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Corporate">Corporate</option>
                <option value="NGO">NGO</option>
                <option value="Individual Provider">Individual Provider</option>
                <option value="Institution">Institution</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Organization / Coordinator Email" required>
              <div className="relative">
                <IconMail className="absolute left-3.5 top-3.5 text-black/60" size={18} />
                <input required name="sub_email" type="email" value={formData.sub_email} onChange={handleChange}
                  className={`${inputCls} pl-10`} placeholder="org@domain.com" />
              </div>
            </Field>

            <Field label="Mobile Number" required>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-2 pointer-events-none border-r border-black/15 pr-3 h-6">
                  <img src="/ph.svg" alt="PH" className="w-5 h-3 object-contain" />
                  <span className="text-xs font-bold text-black/60">+63</span>
                </div>
                <input type="text" required name="contact_number" placeholder="9XXXXXXXXX"
                  value={formData.contact_number} onChange={handleChange}
                  className={`${inputCls} pl-24`} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Telephone Number (Landline)">
              <div className="relative">
                <IconPhone className="absolute left-3.5 top-3.5 text-black/60" size={18} />
                <input type="text" name="tel_number" placeholder="e.g. 0281234567"
                  value={formData.tel_number || ""} onChange={handleChange}
                  className={`${inputCls} pl-10`} />
              </div>
            </Field>

            <Field label="Website / Social Media Page">
              <div className="relative">
                <IconWorld className="absolute left-3.5 top-3.5 text-black/60" size={18} />
                <input name="website" value={formData.website} onChange={handleChange}
                  className={`${inputCls} pl-10`} placeholder="https://your-institution.org or Facebook Link" />
              </div>
            </Field>
          </div>

          {/* SECTION: Address */}
          <SectionLabel label="Operational Address" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Region" required>
              <select required name="region" value={activeRegionCode} onChange={handleChange} className={inputCls}>
                <option value="">Select Region</option>
                {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </Field>
            
            <Field label="City / Municipality" required>
              <select required name="city" value={activeCityCode} onChange={handleChange}
                disabled={!activeRegionCode} className={inputCls}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
            
            <Field label="Barangay" required>
              <select required name="barangay" value={formData.barangay} onChange={handleChange}
                disabled={!activeCityCode} className={inputCls}>
                <option value="">Select Barangay</option>
                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </Field>
          </div>
          
          <Field label="Street Address / Building / Office No." required>
            <div className="relative">
              <IconMapPin className="absolute left-3.5 top-3.5 text-black/60" size={18} />
              <input required name="street_address" value={formData.street_address} onChange={handleChange}
                className={`${inputCls} pl-10`} placeholder="Unit No., Street name, Building location" />
            </div>
          </Field>

          {/* SECTION: Replaced Text Area with Guidelines Navigation Link */}
          <div className="pt-2 flex flex-col items-center justify-center gap-1 bg-white/20 border border-white/30 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="flex items-center gap-2 text-black font-bold text-xs uppercase tracking-wider">
              <IconFileText size={16} className="text-[#093fb4]" />
              Registration Terms
            </div>
            <p className="text-xs text-black/70 max-w-md my-1">
              By submitting this application, you agree to comply with our platform policies.
            </p>
            <button
              type="button"
              onClick={() => navigate('/provider-guidelines')}
              className="text-xs font-black text-[#093fb4] hover:text-[#FF1E1E] underline underline-offset-4 transition-all uppercase tracking-widest mt-1"
            >
              Read Scholarship Provider Guidelines
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isFormInvalid || loading || verifying}
            className="w-full bg-[#093fb4] hover:bg-[#FF1E1E] disabled:bg-white/20 disabled:text-white/40 text-white font-black py-4 rounded-2xl transition-all uppercase text-sm tracking-widest shadow-lg mt-4"
          >
            {loading || verifying ? "Processing Onboarding..." : "Submit Registration Proposal"}
          </button>
        </form>
      </div>

      <OtpModal isOpen={showOtpModal} email={formData.sub_email} onVerify={handleOtpVerified} onCancel={() => setShowOtpModal(false)} />
      <ErrorModal isOpen={showError} onClose={() => setShowError(false)} message={errorMessage} />
      <OrgSuccessModal isOpen={showSuccess} message="Registration Submitted! Awaiting Admin verification." onConfirm={() => navigate('/')} />
    </div>
  );
};

const inputCls = "w-full px-4 py-3 bg-white border border-black/15 rounded-xl text-sm text-black placeholder-black/50 outline-none focus:ring-2 focus:ring-[#093fb4] focus:border-transparent transition-all";

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-black uppercase tracking-widest text-black">
        {label}{required && <span className="text-[#FF1E1E] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-black/20" />
      <span className="text-[11px] font-black uppercase tracking-widest text-black/80">{label}</span>
      <div className="h-px flex-1 bg-black/20" />
    </div>
  );
}

export default OrganizationRegisterPage;