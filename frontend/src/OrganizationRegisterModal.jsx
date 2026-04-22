import React, { useState, useEffect } from 'react';
import { 
  IconBuildingCommunity, IconMail, IconPhone, 
  IconLock, IconX, IconArrowRight, IconMapPin, IconWorld 
} from '@tabler/icons-react';
import { useOrganization } from './useOrganization';
import RegisterPassField from "./RegisterPassField";

const OrganizationRegisterModal = ({ isOpen, onClose }) => {
  const { formData, setFormData, handleOnboard, loading } = useOrganization();

  // 1. Hooks MUST always be at the very top, before ANY return statements
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [activeRegionCode, setActiveRegionCode] = useState('');
  const [activeCityCode, setActiveCityCode] = useState('');

  // Fetch Regions
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/regions/')
      .then(res => res.json())
      .then(data => setRegions(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(err => console.error("Error:", err));
  }, []);

  // Fetch Cities
  useEffect(() => {
    if (activeRegionCode) {
      fetch(`https://psgc.gitlab.io/api/regions/${activeRegionCode}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => setCities(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(err => console.error("Error:", err));
    }
  }, [activeRegionCode]);

  // Fetch Barangays
  useEffect(() => {
    if (activeCityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${activeCityCode}/barangays/`)
        .then(res => res.json())
        .then(data => setBarangays(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(err => console.error("Error:", err));
    }
  }, [activeCityCode]);

  // 2. NOW we can check if it's open
  if (!isOpen) return null;

  // Validation logic (Exact same as yours)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const isPasswordValid = passwordRegex.test(formData.sub_password || "");
  const isPasswordFilled = formData.sub_password.length > 0;
  const isEmailFilled = formData.sub_email.length > 0;
  const passwordsMatch = formData.sub_password !== "" && formData.sub_password === formData.confirm_password;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = emailRegex.test(formData.sub_email || "");

  const websiteRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  const isWebsiteValid = !formData.website || websiteRegex.test(formData.website);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // PSGC logic
    if (name === "region") {
      const selected = regions.find(r => r.code === value);
      setActiveRegionCode(value);
      setFormData(prev => ({ 
        ...prev, 
        region: selected?.name || '', 
        city: '', barangay: '' 
      }));
      return;
    }

    if (name === "city") {
      const selected = cities.find(c => c.code === value);
      setActiveCityCode(value);
      setFormData(prev => ({ 
        ...prev, 
        city: selected?.name || '', 
        barangay: '' 
      }));
      return;
    }

    if (name === "contact_number") {
      let val = value.replace(/\D/g, "");
      if (val.length > 0 && val[0] !== '9') return;
      if (val.length <= 10) setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    if (["first_name", "middle_name", "last_name"].includes(name)) {
      const lettersOnly = value.replace(/[^a-zA-Z\s-]/g, "");
      setFormData(prev => ({ ...prev, [name]: lettersOnly }));
      return;
    }

    if (name === "website") {
      const cleanUrl = value.replace(/\s/g, "").toLowerCase();
      setFormData(prev => ({ ...prev, [name]: cleanUrl }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid || !isEmailValid || !passwordsMatch || !isWebsiteValid) {
      alert("Please check your input fields.");
      return;
    }
    await handleOnboard(); 
    onClose();
  };
  

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><IconX /></button>
        
        <div className="mb-8">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Kyus<span className="text-blue-600">ISKO</span> Onboarding</h3>
          <p className="text-slate-500 font-medium text-sm">Join the network of scholarship providers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <IconBuildingCommunity className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input required name="org_name" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="Organization Name" value={formData.org_name || ''} onChange={handleChange} />
            </div>
            <div className="relative">
              <IconWorld className={`absolute left-4 top-3.5 transition-colors ${formData.website && !isWebsiteValid ? 'text-red-500' : 'text-slate-400'}`} size={18} />
              <input 
                name="website"
                type="url" 
                className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl outline-none text-sm transition-all
                  ${formData.website && !isWebsiteValid ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'}`} 
                placeholder="https://www.your-org.com" 
                value={formData.website || ''}
                onChange={handleChange} 
              />
              {formData.website && !isWebsiteValid && (
                <p className="text-[10px] text-red-500 mt-1 ml-4 font-bold uppercase tracking-tighter">
                  Invalid URL (Must start with http:// or https://)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required name="first_name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="First Name" value={formData.first_name || ''} onChange={handleChange} />
            <input name="middle_name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="Middle Name" value={formData.middle_name || ''} onChange={handleChange} />
            <input required name="last_name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="Last Name" value={formData.last_name || ''} onChange={handleChange} />
          </div>

          <div className="space-y-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-2 mb-1 px-1">
              <IconMapPin size={16} className="text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office Location</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select required name="region" value={activeRegionCode} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm">
                <option value="">Region</option>
                {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
              <select required name="city" value={activeCityCode} onChange={handleChange} disabled={!activeRegionCode} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm disabled:opacity-50">
                <option value="">City</option>
                {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <select required name="barangay" value={formData.barangay || ''} onChange={handleChange} disabled={!activeCityCode} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm disabled:opacity-50">
                <option value="">Barangay</option>
                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <input required name="street_address" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm" placeholder="House No. / Street / Building" value={formData.street_address || ''} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative flex items-center group">
                <div className="absolute left-4 flex items-center pointer-events-none border-r border-slate-200 pr-3">
                    <span className="text-xs font-bold text-slate-400">+63</span>
                </div>
                <input required name="contact_number" type="text" className="w-full p-3 pl-16 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="9XXXXXXXXX" value={formData.contact_number || ''} onChange={handleChange} />
            </div>
            <div className="relative">
              <IconMail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input required name="sub_email" type="email" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="Email (Gmail, Yahoo, etc.)" value={formData.sub_email || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 [&_input]:text-slate-800 [&_input]:bg-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Create Password</label>
                <RegisterPassField name="sub_password" value={formData.sub_password || ''} onChange={handleChange} showStrength={true} />
              </div>
              <div className="space-y-1 [&_input]:text-slate-800 [&_input]:bg-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <RegisterPassField name="confirm_password" value={formData.confirm_password || ''} onChange={handleChange} error={!passwordsMatch ? "Passwords do not match" : ""} />
              </div>
            </div>
          </div>

          <button
  disabled={
    !isEmailFilled || 
    !isPasswordFilled || 
    !isPasswordValid || 
    !passwordsMatch || 
    !formData.org_name || // Make sure Org Name is filled
    loading
  } 
            type="submit" 
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
          >
            {loading ? "Creating Account..." : "Confirm Onboarding"}
            <IconArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizationRegisterModal;