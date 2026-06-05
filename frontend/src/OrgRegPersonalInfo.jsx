import React from 'react';
import { IconMapPin } from '@tabler/icons-react';

const OrgRegPersonalInfo = ({ 
  formData, 
  handleChange, 
  regions, 
  cities, 
  barangays, 
  activeRegionCode, 
  activeCityCode
}) => {
  return (
    <>
      {/* ROW 1: Names */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase ml-2">First Name</label>
          <input required name="first_name" value={formData.first_name}
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-sm outline-none transition-all"
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase ml-2">Middle Name</label>
          <input name="middle_name" value={formData.middle_name}
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-sm outline-none transition-all"
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase ml-2">Last Name</label>
          <input required name="last_name" value={formData.last_name}
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-sm outline-none transition-all"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ROW 2: Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select required name="region" value={activeRegionCode} onChange={handleChange}
          className="p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-xs font-bold outline-none transition-all">
          <option value="">Select Region</option>
          {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
        </select>

        <select required name="city" value={activeCityCode} onChange={handleChange}
          disabled={!activeRegionCode}
          className="p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-xs font-bold outline-none transition-all">
          <option value="">Select City</option>
          {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>

        <select required name="barangay" value={formData.barangay} onChange={handleChange}
          disabled={!activeCityCode}
          className="p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-xs font-bold outline-none transition-all">
          <option value="">Select Barangay</option>
          {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
        </select>
      </div>

      {/* ROW 3: Address + Provider Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Address */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase ml-2">
            Street Address / Building / House No.
          </label>
          <div className="relative">
            <IconMapPin className="absolute left-4 top-4 text-slate-400" size={18} />
            <input
              required
              name="street_address"
              value={formData.street_address}
              className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-sm outline-none transition-all"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Provider Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase ml-2">
            Provider Type
          </label>
          <select
            required
            name="provider_type"
            value={formData.provider_type}
            onChange={handleChange}
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-[#093fb4] rounded-2xl text-xs font-bold outline-none transition-all"
          >
            <option value="">Select Type</option>
            <option value="LGU">LGU</option>
            <option value="NGO">NGO</option>
            <option value="INDIVIDUAL">Individual / Private Sponsorship</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default OrgRegPersonalInfo;