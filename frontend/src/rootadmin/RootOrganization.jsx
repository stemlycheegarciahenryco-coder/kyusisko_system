import React, { useEffect, useState } from 'react';
import { IconEye, IconUser, IconSearch, IconRefresh } from '@tabler/icons-react';
import { ArchiveIcon } from 'lucide-react';
import api from '../api';
import RootOrgView from './RootOrgView';
import { useDialog } from './DialogModal'; // FIX: Imported the missing hook

const TABS = ['all', 'pending', 'approved', 'rejected', 'blocked', 'archived'];

const TAB_LABELS = {
    all: 'All',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    blocked: 'Blocked',
    archived: 'Archived',
};

const colors = { red: '#FF1E1E', white: '#FFFCFB', blue: '#093fb4', green: '#16a34a' };
const ROW_BTN = 'ui-btn !px-4 !py-2.5 !text-micro border';

const RootOrganization = () => {
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const { confirm, notify, dialogElement } = useDialog();

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const resOrgs = await api.get('/onboarding-orgs/list');
            setOrgs(resOrgs.data);
        } catch (err) {
            console.error('Failed to fetch organizations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrgs(); }, []);

    const matchStatusOrAccess = (org, tab) => {
        const isArchived = Boolean(org.is_archived);
        const isDeleted = org.status === 'deleted' || org.account_status === 'deleted';

        if (isDeleted) return false;
        if (tab === 'archived') return isArchived;
        if (isArchived) return false;

        if (tab === 'all') return true;
        if (tab === 'blocked') return !org.is_active;
        return org.status === tab;
    };

    const countByStatus = (status) => orgs.filter((o) => matchStatusOrAccess(o, status)).length;

    const filteredOrgs = orgs.filter((org) => {
        const q = search.toLowerCase();
        const matchSearch =
            org.org_name?.toLowerCase().includes(q) ||
            org.sub_email?.toLowerCase().includes(q);
        return matchStatusOrAccess(org, activeTab) && matchSearch;
    });

    const handleApprove = async (org) => {
        const ok = await confirm({
            variant: 'info',
            title: 'Approve?',
            body: `Verify ${org.org_name}?`,
            confirmText: 'Yes, Approve',
        });
        if (!ok) return;

        try {
            const res = await api.patch(`/onboarding-orgs/approve/${org.id}`);
            const creds = res.data?.credentials;

            setSelectedOrg(null);
            fetchOrgs();

            if (creds) {
                await notify({
                    variant: 'success',
                    title: 'Provider Approved!',
                    confirmText: 'Got it',
                    body: (
                        <div className="text-left">
                            <p className="ui-body mb-3">
                                Share these login credentials with <strong>{org.org_name}</strong>. This password will not be shown again.
                            </p>
                            <div className="bg-slate-100 rounded-2xl p-4 space-y-1.5 text-body text-slate-700 break-all">
                                <p><strong>Provider ID:</strong> {creds.provider_id}</p>
                                <p><strong>Email:</strong> {creds.email}</p>
                                <p>
                                    <strong>Password:</strong>{' '}
                                    <code className="bg-slate-200 px-1.5 py-0.5 rounded-md">{creds.password}</code>
                                </p>
                            </div>
                        </div>
                    ),
                });
            } else {
                notify({ variant: 'success', title: 'Approved!', timer: 1500 });
            }
        } catch {
            notify({ variant: 'error', title: 'Error', body: 'Action failed.', confirmText: 'Close' });
        }
    };

    const handleReject = async (org, reasons, note) => {
        try {
            await api.post(`/onboarding-orgs/reject/${org.id}`, { reasons, note });
            setSelectedOrg(null);
            fetchOrgs();
            notify({ variant: 'info', title: 'Rejected', timer: 1500 });
        } catch (err) {
            notify({
                variant: 'error',
                title: 'Error',
                body: err.response?.data?.error || 'Action failed.',
                confirmText: 'Close',
            });
        }
    };

    const handleBlockToggle = async (org) => {
        const action = org.is_active ? 'Block' : 'Unblock';
        const ok = await confirm({
            title: `${action} Provider?`,
            body: `Update access for ${org.org_name}?`,
            tone: org.is_active ? 'danger' : 'brand',
            confirmText: `Yes, ${action}`,
        });
        if (!ok) return;

        try {
            await api.patch(`/onboarding-orgs/block/${org.id}`);
            setSelectedOrg(null);
            fetchOrgs();
            notify({ variant: 'success', title: 'Status Updated', timer: 1500 });
        } catch {
            notify({ variant: 'error', title: 'Error', body: 'Action failed.', confirmText: 'Close' });
        }
    };

    const handleArchive = async (org) => {
        const actionText = org.is_archived ? 'Unarchive' : 'Archive';

        const ok = await confirm({
            title: `${actionText} Provider?`,
            body: `Confirm you want to ${actionText.toLowerCase()} this Provider?`,
            tone: 'warning',
            confirmText: `Yes, ${actionText}`,
        });
        if (!ok) return;

        try {
            await api.patch(`/onboarding-orgs/archive/${org.id}`);
            setSelectedOrg(null);
            fetchOrgs();
            notify({ variant: 'success', title: `${actionText}d!`, timer: 1500 });
        } catch {
            notify({ variant: 'error', title: 'Error', body: 'Action failed.', confirmText: 'Close' });
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <p className="ui-subtitle animate-pulse">Syncing Providers...</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-10 min-h-screen bg-slate-50 space-y-6">
                <div className="ui-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h2 className="ui-page-title !text-4xl italic">Providers Management</h2>
                    <div className="ui-card !border-brand px-5 py-3">
                        <p className="text-xl font-black leading-none text-brand">{filteredOrgs.length}</p>
                        <p className="text-micro font-black uppercase tracking-widest text-slate-700 mt-1">
                            {activeTab === 'archived' ? 'Archived Providers' : 'Total Providers'}
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:max-w-md">
                    <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ui-input !pl-11 !py-3" />
                </div>

                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`ui-btn !px-5 !py-2.5 border ${isActive
                                    ? 'bg-brand text-white border-brand shadow-md shadow-brand/10'
                                    : 'bg-white text-slate-500 border-slate-300 hover:border-brand/40'}`}
                            >
                                {TAB_LABELS[tab]}
                                <span className={`text-micro font-black px-2 py-0.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {countByStatus(tab)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="ui-card overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-brand-soft border-b border-brand/10">
                                <tr>
                                    <th className="ui-label !text-slate-800 px-6 py-5">Provider Name</th>
                                    <th className="ui-label !text-slate-800 px-6 py-5">Account</th>
                                    <th className="ui-label !text-slate-800 px-6 py-5">Status</th>
                                    <th className="ui-label !text-slate-800 px-6 py-5">Access</th>
                                    <th className="ui-label !text-slate-800 px-6 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrgs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-body font-bold text-slate-400 italic">
                                            No {activeTab === 'all' ? '' : activeTab} providers found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrgs.map((org) => {
                                        const isUpdatedResubmission = org.status === 'pending' && org.rejection_reason;
                                        const isArchived = Boolean(org.is_archived);

                                        const statusStyle = org.status === 'pending'
                                            ? isUpdatedResubmission
                                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                : 'bg-orange-50 text-orange-600 border-orange-100'
                                            : org.status === 'approved'
                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                : 'bg-red-50 text-red-600 border-red-100';

                                        return (
                                            <tr key={org.id} className="hover:bg-slate-50/60 transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-black text-slate-900 text-body uppercase tracking-tight">{org.org_name}</div>
                                                        {isUpdatedResubmission && (
                                                            <span className="bg-amber-500 text-white text-micro font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 tracking-wider shrink-0">
                                                                <IconRefresh size={8} strokeWidth={3} /> Updated
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-micro text-slate-400 font-bold uppercase tracking-wide">
                                                        {org.city || 'Unknown City'}
                                                    </div></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-slate-900 shrink-0">
                                                            <IconUser size={14} />
                                                        </div>
                                                        <div className="text-caption font-bold text-slate-700">{org.sub_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-micro font-black rounded-lg border uppercase tracking-wider ${statusStyle}`}>
                                                        {isUpdatedResubmission ? 'Updated' : org.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-micro font-black rounded-lg border uppercase tracking-wider ${org.is_active
                                                        ? 'bg-brand-soft text-brand border-brand/10'
                                                        : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                        {org.is_active ? 'Active' : 'Blocked'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right flex justify-end items-center gap-4">
                                                    <button
                                                        onClick={() => setSelectedOrg(org)}
                                                        title="View Details"
                                                        className="flex items-center gap-2 p-3 bg-blue-600/10 hover:bg-blue-600 text-[10px] font-black uppercase text-blue-500 hover:text-white border border-blue-600/20 rounded-2xl hover:scale-110 transition-all shadow-md cursor-pointer"
                                                    >
                                                        <IconEye size={20} />
                                                        <span>View</span>
                                                    </button>

                                                    {isArchived ? (
                                                        <button
                                                            onClick={() => handleArchive(org)}
                                                            title="Unarchive"
                                                            className="flex items-center gap-2 p-3 bg-amber-600/10 hover:bg-amber-600 text-[10px] font-black uppercase text-amber-500 hover:text-white border border-amber-600/20 rounded-2xl hover:scale-110 transition-all shadow-md cursor-pointer"
                                                        >
                                                            <ArchiveIcon size={20} />
                                                            <span>Unarchive</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleArchive(org)}
                                                            title={isArchived ? 'Unarchive' : 'Archive'}
                                                            className={`${ROW_BTN} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-600 hover:text-white`}
                                                        >
                                                            <ArchiveIcon size={16} />
                                                            <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                                                        </button>)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <RootOrgView
                org={selectedOrg}
                onClose={() => setSelectedOrg(null)}
                onApprove={handleApprove}
                onReject={handleReject}
                onBlock={handleBlockToggle}
                colors={colors}
                fetchOrgs={fetchOrgs} />

            {dialogElement}
        </>
    );
};

export default RootOrganization;