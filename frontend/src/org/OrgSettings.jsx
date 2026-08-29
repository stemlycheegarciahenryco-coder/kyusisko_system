import React, { useState, useEffect } from 'react';
import api from '../api';
import { Settings, UserPlus, Lock, Users, Trash2, Shield, Eye, EyeOff, AlertCircle, ArrowRightLeft, ShieldOff, ShieldCheck } from 'lucide-react';

export default function OrgSettings() {
  // Default to security since profile is removed
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Co-Admin / User Management State
  const [coAdmins, setCoAdmins] = useState([]);
  const [addForm, setAddForm] = useState({ fullName: '', email: '' });
  const [isMainAccount, setIsMainAccount] = useState(true);

  // Transfer Ownership confirmation state (per-row action now, not a separate tab)
  const [transferTargetId, setTransferTargetId] = useState(null);

  // Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
  const orgInfo = JSON.parse(localStorage.getItem('orgInfo') || '{}');
  
  // ✅ FIX: Properly detect if the logged-in user is the main account
  const isMain = orgInfo.accountType !== 'co_admin' && !orgInfo.is_co_admin;
  setIsMainAccount(isMain);

  // If a co-admin is somehow on 'user-management', kick them back to 'security'
  if (!isMain && activeTab === 'user-management') {
    setActiveTab('security');
  }

  if (isMain && activeTab === 'user-management') {
    fetchCoAdmins();
  }
}, [activeTab]);

  const fetchCoAdmins = async () => {
    try {
      const res = await api.get('/organizations/co-admins');
      setCoAdmins(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch co-admins:', err);
    }
  };

  const handleAddCoAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // No password field here — co-admins inherit the org's current
      // password on the backend (see orgController.addCoAdmin).
      await api.post('/organizations/co-admins', addForm);
      setMessage({ type: 'success', text: 'Co-admin added successfully.' });
      setAddForm({ fullName: '', email: '' });
      fetchCoAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add co-admin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to remove this co-admin? This cannot be undone.')) return;
    try {
      await api.delete(`/organizations/co-admins/${id}`);
      setMessage({ type: 'success', text: 'Co-admin removed.' });
      fetchCoAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to remove co-admin.' });
    }
  };

  const handleToggleBlock = async (admin) => {
    const action = admin.is_active ? 'block' : 'unblock';
    if (!window.confirm(`${action === 'block' ? 'Block' : 'Unblock'} ${admin.first_name}? ${action === 'block' ? 'They will not be able to log in until unblocked.' : ''}`)) return;
    try {
      await api.patch(`/organizations/co-admins/${admin.id}/block`);
      setMessage({ type: 'success', text: `Co-admin ${action === 'block' ? 'blocked' : 'unblocked'}.` });
      fetchCoAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to ${action} co-admin.` });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setMessage({ type: 'error', text: "New passwords don't match." });
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/user-org/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async (admin) => {
    if (!window.confirm(`WARNING: Transferring ownership to ${admin.first_name} ${admin.last_name} will demote your account to a co-admin. Continue?`)) return;

    setTransferTargetId(admin.id);
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/user-org/transfer-ownership', {
        targetUserId: admin.id
      });
      setMessage({ type: 'success', text: 'Ownership transferred successfully. You are now a co-admin.' });

      const orgInfo = JSON.parse(localStorage.getItem('orgInfo') || '{}');
      localStorage.setItem('orgInfo', JSON.stringify({ ...orgInfo, is_co_admin: true }));
      setIsMainAccount(false);
      setActiveTab('security');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to transfer ownership.' });
    } finally {
      setLoading(false);
      setTransferTargetId(null);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-['Inter']">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
          <Settings className="text-[#093fb4]" size={32} /> Organization Settings
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Manage your account preferences and access controls.
        </p>
      </header>

      {/* Global Message Banner */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          <AlertCircle size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="space-y-2">
            <TabButton
              active={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
              icon={<Lock size={18} />}
              label="Security & Password"
            />
            {isMainAccount && (
              <TabButton
                active={activeTab === 'user-management'}
                onClick={() => setActiveTab('user-management')}
                icon={<Users size={18} />}
                label="User Management"
              />
            )}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-black/5">

          {/* ─── SECURITY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Update Password</h2>
                <p className="text-xs text-slate-500 font-medium">Ensure your account uses a strong, secure password.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#093fb4] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#093fb4] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#093fb4] transition-all"
                    />
                    {/* Single toggle covers all three fields */}
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#093fb4]"
                      title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* ─── USER MANAGEMENT TAB ─────────────────────────────────────────
              Merges the old "Co-Admin Access" + "Transfer Ownership" tabs.
              Create form only takes Full Name + Email — a unique temporary
              password is generated server-side and emailed to the co-admin.
              Each row gets Block, Delete, and Transfer Ownership actions. */}
          {activeTab === 'user-management' && isMainAccount && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Manage Users</h2>
                <p className="text-xs text-slate-500 font-medium">Create co-admin accounts and manage their access.</p>
              </div>

              {/* Add Co-Admin Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-[#093fb4] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserPlus size={14} /> Add New Sub-Admin
                </h3>
                <form onSubmit={handleAddCoAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Username</label>
                    <input
                      type="text"
                      required
                      value={addForm.fullName}
                      onChange={e => setAddForm({...addForm, fullName: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#093fb4] transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={addForm.email}
                      onChange={e => setAddForm({...addForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#093fb4] transition-all"
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-[#093fb4] hover:bg-blue-800 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                    >
                      {loading ? 'Adding...' : 'Create Co-Admin'}
                    </button>
                  </div>
                </form>
                <p className="text-[10px] text-slate-400 font-semibold mt-3">
                  A temporary password is generated and emailed to them. They'll be prompted to set their own password on first login.
                </p>
              </div>

              {/* Co-Admin List */}
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Active Sub-Admins ({coAdmins.length})</h3>
                <div className="space-y-3">
                  {coAdmins.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400 py-4">No co-admins configured for this organization.</p>
                  ) : (
                    coAdmins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-[#093fb4] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl shrink-0 ${admin.is_active ? 'bg-blue-50 text-[#093fb4]' : 'bg-slate-100 text-slate-400'}`}>
                            <Shield size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                              {admin.first_name} {admin.middle_name} {admin.last_name}
                              {!admin.is_active && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Blocked</span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">{admin.sub_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTransferOwnership(admin)}
                            disabled={loading && transferTargetId === admin.id}
                            className="p-2 text-slate-400 hover:text-[#093fb4] hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                            title="Transfer Ownership"
                          >
                            <ArrowRightLeft size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(admin)}
                            className={`p-2 rounded-xl transition-colors ${admin.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-amber-600 hover:bg-amber-50'}`}
                            title={admin.is_active ? 'Block Co-Admin' : 'Unblock Co-Admin'}
                          >
                            {admin.is_active ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                          </button>
                          <button
                            onClick={() => handleRemoveCoAdmin(admin.id)}
                            className="p-2 text-slate-400 hover:text-[#FF1E1E] hover:bg-red-50 rounded-xl transition-colors"
                            title="Remove Co-Admin"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Reusable Tab Button Component
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
        active
          ? 'bg-[#093fb4] text-white shadow-md'
          : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon} {label}
    </button>
  );
}