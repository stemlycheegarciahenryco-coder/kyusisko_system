import React, { useEffect, useState } from 'react';
import api from '../api';
import { IconCheck, IconX, IconEye, IconWorld } from '@tabler/icons-react';

const RootOrganization = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null); // For the View Modal
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/onboarding/list'); 
      setOrgs(res.data);
    } catch (err) {
      console.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/onboarding/approve/${id}`);
      setSelectedOrg(null);
      fetchOrgs();
    } catch (err) { alert("Approval failed"); }
  };

  const handleReject = async (id) => {
    if (!rejectReason) return alert("Please provide a reason for rejection.");
    try {
      await api.post(`/onboarding/reject/${id}`, { reason: rejectReason });
      setSelectedOrg(null);
      setShowRejectInput(false);
      setRejectReason('');
      fetchOrgs();
    } catch (err) { alert("Rejection failed"); }
  };

  if (loading) return <div className="p-10 text-slate-500 font-bold">Loading...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Onboarding</h1>
        <p className="text-slate-500 text-sm">Review and validate new scholarship donors.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{org.org_name}</div>
                  <div className="text-xs text-slate-400">{org.sub_email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-600 font-medium">{org.city}, {org.region}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${org.is_active ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {org.is_active ? 'ACTIVE' : 'PENDING'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedOrg(org)}
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
                  >
                    <IconEye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedOrg.org_name}</h2>
                <p className="text-slate-400 text-sm">Registration Details</p>
              </div>
              <button onClick={() => {setSelectedOrg(null); setShowRejectInput(false);}} className="text-slate-400 hover:text-slate-600">
                <IconX size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Representative</p>
                  <p className="text-sm font-bold text-slate-700">{selectedOrg.first_name} {selectedOrg.last_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                  <p className="text-sm font-bold text-slate-700">{selectedOrg.contact_number}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                <p className="text-sm font-medium text-slate-700">
                  {selectedOrg.street_address}, {selectedOrg.barangay}, {selectedOrg.city}, {selectedOrg.region}
                </p>
              </div>

              {selectedOrg.website && (
                <div className="flex items-center gap-2 text-blue-600 text-sm font-bold">
                  <IconWorld size={16} />
                  <a href={selectedOrg.website} target="_blank" rel="noreferrer">{selectedOrg.website}</a>
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            {!selectedOrg.is_active && (
              <div className="space-y-4">
                {showRejectInput ? (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <textarea 
                      className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-900 placeholder:text-red-300 focus:outline-none"
                      placeholder="Reason for rejection (sent via email)..."
                      rows="3"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleReject(selectedOrg.id)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Confirm Reject</button>
                      <button onClick={() => setShowRejectInput(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprove(selectedOrg.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      <IconCheck size={20} /> Accept Organization
                    </button>
                    <button 
                      onClick={() => setShowRejectInput(true)}
                      className="px-6 flex items-center justify-center bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                      <IconX size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RootOrganization;