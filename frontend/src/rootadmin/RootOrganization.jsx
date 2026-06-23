import React, { useEffect, useState } from 'react';
import api from '../api';
import { IconEye, IconUser, IconSearch, IconRefresh } from '@tabler/icons-react';
import Swal from 'sweetalert2';
import RootOrgView from './RootOrgView';

const TABS = ['all', 'pending', 'approved', 'rejected'];

const RootOrganization = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const colors = { red: '#FF1E1E', white: '#FFFCFB', blue: '#093fb4' };

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/onboarding-orgs/list');
      setOrgs(res.data);
    } catch (err) {
      console.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const countByStatus = (status) =>
    orgs.filter((o) => o.status === status).length;

  const filteredOrgs = orgs.filter((org) => {
    const matchTab = activeTab === 'all' || org.status === activeTab;
    const matchSearch =
      org.org_name.toLowerCase().includes(search.toLowerCase()) ||
      org.sub_email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const swalConfig = (title, text, icon, confirmColor) => ({
    title, text, icon,
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#94a3b8',
    background: colors.white,
    color: '#0f172a',
    borderRadius: '24px',
  });

  const handleApprove = async (org) => {
    const result = await Swal.fire(swalConfig('Approve?', `Verify ${org.org_name}?`, 'question', colors.blue));
    if (result.isConfirmed) {
      try {
        await api.patch(`/onboarding-orgs/approve/${org.id}`);
        Swal.fire({ title: 'Approved!', icon: 'success', timer: 1500, showConfirmButton: false });
        setSelectedOrg(null);
        fetchOrgs();
      } catch { Swal.fire('Error', 'Action failed.', 'error'); }
    }
  };

  const handleReject = async (org) => {
    const { value: reason } = await Swal.fire({
      ...swalConfig('Reject Application', `Reason for rejecting ${org.org_name}?`, 'warning', colors.red),
      input: 'textarea',
      inputPlaceholder: 'Type reason here...',
    });
    if (reason) {
      try {
        await api.post(`/onboarding-orgs/reject/${org.id}`, { reason });
        Swal.fire({ title: 'Rejected', icon: 'info', timer: 1500, showConfirmButton: false });
        setSelectedOrg(null);
        fetchOrgs();
      } catch { Swal.fire('Error', 'Action failed.', 'error'); }
    }
  };

  const handleBlockToggle = async (org) => {
    const action = org.is_active ? 'Block' : 'Unblock';
    const result = await Swal.fire(swalConfig(`${action} Provider?`, `Update access for ${org.org_name}?`, 'warning', '#111827'));
    if (result.isConfirmed) {
      try {
        await api.patch(`/onboarding-orgs/block/${org.id}`);
        Swal.fire({ title: 'Status Updated', icon: 'success', timer: 1500, showConfirmButton: false });
        setSelectedOrg(null);
        fetchOrgs();
      } catch { Swal.fire('Error', 'Action failed.', 'error'); }
    }
  };

  if (loading)
    return (
      <div className="p-10 text-slate-500 font-bold italic animate-pulse text-center font-['Inter',_sans-serif]">
        Syncing Providers...
      </div>
    );

  const tabLabels = { all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

  return (
    <div className="p-8 min-h-screen font-['Inter',_sans-serif]" style={{ backgroundColor: colors.white }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-[#093fb4]/10 shadow-sm mb-6">
        <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">
          Providers Management
        </h2>
        <div className="px-5 py-3 rounded-2xl border border-[#093fb4] bg-white shadow-sm">
          <p className="text-xl font-black leading-none text-[#093fb4]">{orgs.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-black mt-1">Total Providers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const count = tab === 'all' ? orgs.length : countByStatus(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                isActive
                  ? 'bg-[#093fb4] text-white border-[#093fb4] shadow-md shadow-blue-900/10'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-[#093fb4]/30'
              }`}
            >
              {tabLabels[tab]}
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-full md:max-w-md mb-6">
        <IconSearch size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40" />
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-3.5 bg-white border border-[#093fb4]/20 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#093fb4]/10 text-black font-medium transition-all text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#093fb4]/5 border-b border-[#093fb4]/10">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black">Provider Name</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black">Account</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black">Access</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right text-black"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#093fb4]/5">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-sm font-bold text-slate-400 italic">
                    No providers found.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  // Check if this provider has updated compliance docs
                  const isUpdatedResubmission = org.status === 'pending' && org.rejection_reason;
                  
                  return (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{org.org_name}</div>
                          {isUpdatedResubmission && (
                            <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 tracking-wider shrink-0">
                              <IconRefresh size={8} strokeWidth={3} /> UPDATED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{org.city || 'Unknown City'}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-slate-900">
                            <IconUser size={14} />
                          </div>
                          <div className="text-xs font-bold text-slate-700">{org.sub_email}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1 text-[10px] font-black rounded-lg border uppercase tracking-tighter ${
                          org.status === 'pending'  ? (isUpdatedResubmission ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-orange-50 text-orange-600 border-orange-100') :
                          org.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                                                      'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {isUpdatedResubmission ? 'Updated' : org.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1 text-[10px] font-black rounded-lg border uppercase tracking-tighter ${
                          org.is_active ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {org.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => setSelectedOrg(org)}
                          className="p-3 bg-slate-900 text-white rounded-2xl hover:scale-110 transition-transform shadow-lg"
                        >
                          <IconEye size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RootOrgView
  org={selectedOrg}
  onClose={() => setSelectedOrg(null)}
  onApprove={handleApprove}
  onReject={handleReject}
  onBlock={handleBlockToggle}
  colors={colors}
  fetchOrgs={fetchOrgs} // Added line here
/>
    </div>
  );
};

export default RootOrganization;