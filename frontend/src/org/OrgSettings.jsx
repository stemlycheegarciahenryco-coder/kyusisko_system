import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Shield, Users, Key, Crown, ArrowRightLeft, Lock, 
    CheckCircle2, AlertTriangle, UserPlus, Trash2, Mail 
} from 'lucide-react';

const OrgSettings = () => {
    // Read account_type from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user')) || { account_type: 'co_admin', id: null };
    const isMain = currentUser.account_type === 'main';

    // TAB STATE (Tab 1: 'security', Tab 2: 'users')
    const [activeTab, setActiveTab] = useState('security');

    // Password State (Tab 1)
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    // User Management State (Tab 2)
    const [teamMembers, setTeamMembers] = useState([]);
    const [coAdminData, setCoAdminData] = useState({ firstName: '', middleName: '', lastName: '', email: '' });
    const [addMsg, setAddMsg] = useState({ type: '', text: '' });

    // Modals
    const [transferModal, setTransferModal] = useState({ open: false, targetUser: null });
    const [removeModal, setRemoveModal] = useState({ open: false, targetUser: null });

    useEffect(() => {
        if (activeTab === 'users' && isMain) {
            fetchTeamMembers();
        }
    }, [activeTab]);

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get('/user-org/co-admins');
            setTeamMembers(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch team members:", err);
        }
    };

    // ── TAB 1 ACTION: CHANGE PASSWORD ──
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPassMsg({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPassMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        try {
            await api.patch('/user-org/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setPassMsg({ type: 'success', text: 'Password successfully updated!' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPassMsg({ type: 'error', text: err.response?.data?.error || 'Password update failed.' });
        }
    };

    // ── TAB 2 ACTION: ADD CO-ADMIN EMAIL ──
    const handleAddCoAdmin = async (e) => {
        e.preventDefault();
        setAddMsg({ type: '', text: '' });

        try {
            await api.post('/user-org/co-admins', coAdminData);
            setAddMsg({ type: 'success', text: 'Member added and invitation sent!' });
            setCoAdminData({ firstName: '', middleName: '', lastName: '', email: '' });
            fetchTeamMembers();
        } catch (err) {
            setAddMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add member.' });
        }
    };

    // ── TAB 2 ACTION: REMOVE MEMBER ──
    const handleConfirmRemove = async () => {
        if (!removeModal.targetUser) return;
        try {
            await api.delete(`/user-org/co-admins/${removeModal.targetUser.id}`);
            setRemoveModal({ open: false, targetUser: null });
            fetchTeamMembers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove member.');
        }
    };

    // ── TAB 2 ACTION: TRANSFER OWNERSHIP ──
    const handleConfirmTransfer = async () => {
        if (!transferModal.targetUser) return;
        try {
            await api.post('/user-org/transfer-ownership', {
                targetUserId: transferModal.targetUser.id
            });
            alert('Ownership transferred successfully! Your account is now a Co-Admin.');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.error || 'Transfer failed.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 font-['Inter']">
            {/* PAGE HEADER */}
            <div className="mb-6">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Shield className="text-[#093fb4]" size={22} /> Organization Settings
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">Manage security credentials and organization admin members.</p>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex border-b border-slate-200 mb-6 gap-2">
                {/* TAB 1: PASSWORD & SECURITY */}
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'security' ? 'border-[#093fb4] text-[#093fb4]' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Key size={14} /> Password & Security
                </button>

                {/* TAB 2: USER MANAGEMENT */}
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'users' ? 'border-[#093fb4] text-[#093fb4]' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Users size={14} /> User Management
                </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: PASSWORD & SECURITY CONTENT                               */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'security' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-lg">
                    <div className="mb-4 pb-3 border-b border-slate-100">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Change Password</h2>
                        <p className="text-[11px] text-slate-500">
                            Update account access password for your organization.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {passMsg.text && (
                            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                passMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {passMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                {passMsg.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={passwords.currentPassword}
                                onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                value={passwords.newPassword}
                                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={passwords.confirmPassword}
                                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#093fb4]"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 bg-[#093fb4] hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: USER MANAGEMENT CONTENT                                   */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* RESTRICTION WARNING FOR CO-ADMINS */}
                    {!isMain && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                            <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                You are currently logged in as a <b>Co-Admin</b>. Inviting new members and transferring main account ownership can only be managed by the <b>Main Account</b> owner.
                            </p>
                        </div>
                    )}

                    {/* SECTION 1: ADD MEMBER FORM (MAIN ONLY) */}
                    {isMain && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <UserPlus className="text-[#093fb4]" size={18} />
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Add New Admin Member</h2>
                                    <p className="text-[11px] text-slate-500">Enter member email and details to assign co-admin permissions.</p>
                                </div>
                            </div>

                            {addMsg.text && (
                                <div className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                                    addMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {addMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                    {addMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleAddCoAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={coAdminData.firstName}
                                        onChange={e => setCoAdminData({ ...coAdminData, firstName: e.target.value })}
                                        className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={coAdminData.lastName}
                                        onChange={e => setCoAdminData({ ...coAdminData, lastName: e.target.value })}
                                        className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        value={coAdminData.email}
                                        onChange={e => setCoAdminData({ ...coAdminData, email: e.target.value })}
                                        className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#093fb4]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="py-2 px-4 bg-[#093fb4] hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 h-[38px]"
                                >
                                    <Mail size={14} /> Add Member
                                </button>
                            </form>
                        </div>
                    )}

                    {/* SECTION 2: LIST OF ADMIN MEMBERS */}
                    {isMain && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                            <div className="mb-4 pb-3 border-b border-slate-100">
                                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Admin Members List</h2>
                                <p className="text-[11px] text-slate-500">Active accounts with access to your organization dashboard.</p>
                            </div>

                            <div className="space-y-3">
                                {/* MAIN ACCOUNT HOLDER BADGE */}
                                <div className="p-4 border border-amber-200 bg-amber-50/40 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                                            <Crown size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-slate-900">You (Main Organization Owner)</p>
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-800">
                                                    Main Account
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Full administrative privileges</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CO-ADMIN MEMBERS */}
                                {teamMembers.length === 0 ? (
                                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                                        No co-admin members added yet. Use the form above to add an admin email.
                                    </div>
                                ) : (
                                    teamMembers.map(member => (
                                        <div key={member.id} className="p-4 border border-slate-200/80 rounded-2xl flex items-center justify-between bg-white hover:border-slate-300 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#093fb4] border border-blue-100 flex items-center justify-center font-black text-sm">
                                                    {member.first_name ? member.first_name.charAt(0) : 'C'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {member.first_name} {member.last_name}
                                                        </p>
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-600">
                                                            Co-Admin
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{member.sub_email}</p>
                                                </div>
                                            </div>

                                            {/* ACTION BUTTONS (MAIN ONLY) */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setTransferModal({ open: true, targetUser: member })}
                                                    className="px-3 py-1.5 border border-amber-200 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase tracking-wider text-amber-800 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <ArrowRightLeft size={12} /> Transfer Ownership
                                                </button>
                                                <button
                                                    onClick={() => setRemoveModal({ open: true, targetUser: member })}
                                                    className="p-2 border border-red-200 bg-red-50/50 rounded-xl text-red-600 hover:bg-red-100 transition cursor-pointer"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* REMOVE CO-ADMIN CONFIRMATION MODAL */}
            {removeModal.open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4">
                            <Trash2 size={22} />
                        </div>

                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Remove Admin Member</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Are you sure you want to remove <b>{removeModal.targetUser?.first_name} {removeModal.targetUser?.last_name}</b>? They will lose access to organization management.
                        </p>

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => setRemoveModal({ open: false, targetUser: null })}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemove}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                            >
                                Remove Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TRANSFER OWNERSHIP CONFIRMATION MODAL */}
            {transferModal.open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Confirm Ownership Transfer</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Are you sure you want to transfer Main Account privileges to <b>{transferModal.targetUser?.first_name} {transferModal.targetUser?.last_name}</b>?
                        </p>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 my-4 text-[11px] text-slate-600 space-y-1">
                            <p>• Your account will become a <b>Co-Admin</b>.</p>
                            <p>• You will no longer manage member invites or transfer ownership.</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setTransferModal({ open: false, targetUser: null })}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmTransfer}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                            >
                                Transfer Ownership
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgSettings;