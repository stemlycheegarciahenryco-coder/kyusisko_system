import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, ClipboardList, UserCog, GraduationCap, UserPlus, Building2, Archive, Search, X, ShieldCheck, Edit } from 'lucide-react';
import { IconLock } from '@tabler/icons-react';
import api from '../api';
import { useDialog } from './DialogModal';

const STAT_CARDS = [
    { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { key: 'totalSubAdmins', label: 'Active Orgs', icon: UserCog, color: 'bg-amber-50 text-amber-600' },
    { key: 'totalScholarships', label: 'Scholarship Programs', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'totalApplications', label: 'Total Applications', icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
];

const CHART_CONFIG = [
    { key: 'totalStudents', name: 'Students', color: '#093fb4' },
    { key: 'totalSubAdmins', name: 'Organizations', color: '#f59e0b' },
    { key: 'totalScholarships', name: 'Scholarships', color: '#10b981' },
];

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '' };

// Small action button used inside list rows
const ROW_BTN = 'ui-btn !px-3.5 !py-2 !text-micro border';

function CoAdminSection({
    coAdmins = [],
    loading,
    onToggleStatus,
    onArchive,
    onEditCoAdmin,
    onCreateCoAdmin,
    formData,
    setFormData,
    editingAdmin,
    setEditingAdmin,
}) {
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'blocked' | 'archived'
    const [searchQuery, setSearchQuery] = useState('');
    const formRef = useRef(null);
    const firstNameInputRef = useRef(null);

    const handleCancelEdit = () => {
        setEditingAdmin(null);
        setFormData(EMPTY_FORM);
    };

    // Clicking Edit again on the same row toggles edit mode off
    const handleStartEdit = (admin) => {
        if (editingAdmin?.id === admin.id) {
            handleCancelEdit();
            return;
        }

        setEditingAdmin(admin);
        setFormData({
            firstName: admin.first_name || '',
            lastName: admin.last_name || '',
            email: admin.email || '',
            password: '', // blank = keep current password
        });

        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => firstNameInputRef.current?.focus(), 200);
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (editingAdmin) {
            onEditCoAdmin(editingAdmin.id, formData);
        } else {
            onCreateCoAdmin(e);
        }
    };

    const { filteredCoAdmins, tabCounts } = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const counts = { all: 0, active: 0, blocked: 0, archived: 0 };
        const matchedList = [];

        coAdmins.forEach((admin) => {
            if (admin.account_status === 'deleted') return;

            const isArchived = Boolean(admin.is_archived);
            const membership = {
                all: !isArchived,
                active: admin.account_status === 'active' && !isArchived,
                blocked: admin.account_status === 'suspended' && !isArchived,
                archived: isArchived,
            };

            const fullName = `${admin.first_name || ''} ${admin.last_name || ''}`.toLowerCase();
            const email = (admin.email || '').toLowerCase();
            const uid = (admin.uid || '').toLowerCase();
            const matchesSearch = !query || fullName.includes(query) || email.includes(query) || uid.includes(query);

            if (!matchesSearch) return;

            Object.keys(counts).forEach((tab) => {
                if (membership[tab]) counts[tab]++;
            });

            if (membership[activeTab]) matchedList.push(admin);
        });

        return { filteredCoAdmins: matchedList, tabCounts: counts };
    }, [coAdmins, activeTab, searchQuery]);

    return (
        <section className="ui-card p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 m-0">
                    <UserPlus className="text-brand" size={18} /> Co-Admin Management
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Register / Edit form */}
                <form
                    ref={formRef}
                    onSubmit={handleSubmitForm}
                    className="space-y-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8"
                >
                    <div className="flex items-center gap-1.5 mb-2">
                        <Edit size={13} className="text-brand" />
                        <p className="ui-label !text-slate-400 truncate">
                            {editingAdmin
                                ? `Editing: ${editingAdmin.first_name} ${editingAdmin.last_name}`
                                : 'Register New Co-Admin'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            ref={firstNameInputRef}
                            type="text"
                            placeholder="First Name"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="ui-input"
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="ui-input"
                        />
                    </div>
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="ui-input"
                    />
                    <div>
                        <input
                            type="password"
                            placeholder={editingAdmin ? 'New Password (leave blank to keep current)' : 'Password'}
                            required={!editingAdmin}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="ui-input"
                        />
                        {editingAdmin && (
                            <p className="text-micro text-slate-400 mt-1 pl-1 font-medium italic">
                                Leave blank to retain current password.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {editingAdmin && (
                            <button type="button" onClick={handleCancelEdit} className="ui-btn-secondary flex-1">
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="ui-btn-primary flex-1">
                            {editingAdmin ? 'Update Account' : 'Create Account'}
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="ui-label !text-slate-400 shrink-0">Co-Admins List</p>

                        <div className="relative w-full sm:w-56">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search co-admin..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ui-input !pl-9 !pr-8 !py-2"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
                        {['all', 'active', 'blocked', 'archived'].map((tab) => {
                            const isActiveTab = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`ui-btn !px-4 !py-2 !text-micro border ${isActiveTab
                                        ? 'bg-brand text-white border-brand shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <span>{tab}</span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-micro ${isActiveTab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {tabCounts[tab] || 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Rows */}
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                        {loading ? (
                            <p className="text-caption font-medium text-slate-400 italic text-center py-4">Loading administrators...</p>
                        ) : filteredCoAdmins.length === 0 ? (
                            <p className="text-caption font-medium text-slate-400 italic py-4 text-center">
                                {searchQuery
                                    ? `No co-admins matching "${searchQuery}"`
                                    : `No ${activeTab === 'all' ? '' : activeTab} co-admins found.`}
                            </p>
                        ) : (
                            filteredCoAdmins.map((admin) => {
                                const isArchived = Boolean(admin.is_archived);
                                const isEditing = editingAdmin?.id === admin.id;
                                const isActive = admin.account_status === 'active';

                                return (
                                    <div
                                        key={admin.id}
                                        className={`flex justify-between items-center p-5 rounded-2xl border transition-all gap-4 ${isEditing
                                            ? 'bg-brand-soft/60 border-brand ring-2 ring-brand/10 shadow-md'
                                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-black text-slate-800 text-body uppercase tracking-tight truncate">
                                                    {admin.first_name} {admin.last_name}
                                                </p>
                                                <span className="text-micro font-bold px-2 py-0.5 bg-brand-soft text-brand rounded-md tracking-wider">
                                                    {admin.uid}
                                                </span>
                                                {isEditing && (
                                                    <span className="text-micro font-black px-2 py-0.5 bg-brand text-white rounded-md tracking-wider uppercase animate-pulse">
                                                        Editing Now
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-caption text-slate-500 font-medium truncate">{admin.email}</p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {!isArchived && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleStatus(admin.id, admin.account_status)}
                                                    className={`${ROW_BTN} ${isActive
                                                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                                        : 'bg-brand text-white border-brand hover:bg-brand-dark shadow-sm'
                                                        }`}
                                                >
                                                    {isActive ? <IconLock size={12} /> : <ShieldCheck size={12} />}
                                                    {isActive ? 'Block' : 'Unblock'}
                                                </button>
                                            )}

                                            {!isArchived && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(admin)}
                                                    className={`${ROW_BTN} ${isEditing
                                                        ? 'bg-brand text-white border-brand shadow-sm'
                                                        : 'bg-brand-soft text-brand border-brand/20 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    <Edit size={12} />
                                                    {isEditing ? 'Editing' : 'Edit'}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => onArchive(admin)}
                                                className={`${ROW_BTN} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}
                                            >
                                                <Archive size={12} />
                                                {isArchived ? 'Unarchive' : 'Archive'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function RootDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [coAdmins, setCoAdmins] = useState([]);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingAdmin, setEditingAdmin] = useState(null);

    const { confirm, notify, dialogElement } = useDialog();

    const userRole = localStorage.getItem('userRole') || 'co_admin';

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const promises = [api.get('/stats')];

            if (userRole === 'root_admin') {
                promises.push(api.get('/system-admin/co-admins'));
            }

            const [statsRes, adminsRes] = await Promise.all(promises);

            if (statsRes?.data) setStats(statsRes.data);
            if (adminsRes?.data?.success) setCoAdmins(adminsRes.data.data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            notify({
                variant: 'error',
                title: 'Error Loading Data',
                body: 'Failed to retrieve dashboard parameters. Please refresh or try again.',
                confirmText: 'Close',
            });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleCreateCoAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/system-admin/create-co-admin', formData);
            if (response.data.success) {
                const createdAdmin = response.data.data;
                const normalizedAdmin = {
                    ...createdAdmin,
                    first_name: createdAdmin.first_name || formData.firstName,
                    last_name: createdAdmin.last_name || formData.lastName,
                    account_status: createdAdmin.account_status || 'active',
                };

                setCoAdmins((prev) => [normalizedAdmin, ...prev]);
                setFormData(EMPTY_FORM);

                notify({
                    variant: 'success',
                    title: 'Co-Admin Created',
                    body: `Account successfully registered! Generated ID: ${createdAdmin.uid || createdAdmin.id}`,
                    confirmText: 'Done',
                });
            }
        } catch (err) {
            notify({
                variant: 'error',
                title: 'Registration Failed',
                body: err.response?.data?.message || 'Invalid Credentials',
                confirmText: 'Close',
            });
        }
    };

    const handleUpdateCoAdmin = async (id, updatedData) => {
        try {
            const payload = { ...updatedData };
            if (!payload.password) delete payload.password;

            const response = await api.put(`/system-admin/co-admins/update/${id}`, payload);

            if (response.data.success || response.status === 200) {
                setCoAdmins((prev) =>
                    prev.map((admin) =>
                        admin.id === id
                            ? { ...admin, first_name: updatedData.firstName, last_name: updatedData.lastName, email: updatedData.email }
                            : admin
                    )
                );

                setEditingAdmin(null);
                setFormData(EMPTY_FORM);

                notify({ variant: 'success', title: 'Co-Admin Updated', body: 'Account details have been updated successfully.', timer: 1800 });
            }
        } catch (err) {
            console.error('Failed to update co-admin:', err);
            notify({
                variant: 'error',
                title: 'Update Failed',
                body: err.response?.data?.message || 'Failed to update account.',
                confirmText: 'Close',
            });
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const isBlocking = currentStatus === 'active';
        const actionText = isBlocking ? 'block' : 'unblock';
        const nextStatus = isBlocking ? 'suspended' : 'active';

        const ok = await confirm({
            title: 'Are you sure?',
            body: `Do you want to ${actionText} this Co-Admin account?`,
            tone: isBlocking ? 'danger' : 'brand',
            confirmText: `Yes, ${actionText}`,
        });
        if (!ok) return;

        try {
            const response = await api.patch(`/system-admin/toggle-status/${id}`, { status: nextStatus });
            if (response.data.success) {
                setCoAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, account_status: nextStatus } : admin)));
                notify({
                    variant: 'success',
                    title: 'Status Updated',
                    body: `Account has been successfully ${nextStatus === 'suspended' ? 'blocked' : 'unblocked'}.`,
                    timer: 1800,
                });
            }
        } catch (err) {
            console.error('Could not complete requested state transition:', err);
            notify({
                variant: 'error',
                title: 'Action Failed',
                body: err.response?.data?.message || 'Could not update account status.',
                confirmText: 'Close',
            });
        }
    };

    const handleArchive = async (admin) => {
        const actionText = admin.is_archived ? 'Unarchive' : 'Archive';

        const ok = await confirm({
            title: `${actionText} Co-Admin?`,
            body: `Confirm you want to ${actionText.toLowerCase()} this co-admin record.`,
            tone: 'warning',
            confirmText: `Yes, ${actionText}`,
        });
        if (!ok) return;

        try {
            const response = await api.patch(`/system-admin/archive/${admin.id}`);
            if (response.data.success || response.status === 200) {
                setCoAdmins((prev) => prev.map((item) => (item.id === admin.id ? { ...item, is_archived: !item.is_archived } : item)));
                notify({ variant: 'success', title: 'Status Updated', timer: 1500 });
            }
        } catch (err) {
            console.error(err);
            notify({
                variant: 'error',
                title: 'Error',
                body: err.response?.data?.message || 'Action failed.',
                confirmText: 'Close',
            });
        }
    };

    const pieChartData = useMemo(() => {
        if (!stats) return [];
        return CHART_CONFIG.map((cfg) => ({
            name: cfg.name,
            value: stats[cfg.key] || 0,
            color: cfg.color,
        }));
    }, [stats]);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="ui-page-title !text-3xl italic">
                    System Admin<span className="text-brand"> Dashboard</span>
                </h1>
            </div>

            <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map((card) => (
                        <div key={card.key} className="ui-card p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center shrink-0`}>
                                <card.icon size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="ui-label !text-slate-400 truncate">{card.label}</p>
                                <p className="text-2xl font-black text-slate-800">{loading ? '...' : stats?.[card.key] ?? 0}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart + recent lists */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                    <div className="ui-card p-6 flex flex-col min-h-[360px] xl:col-span-1">
                        <h4 className="ui-label !text-slate-400 mb-4 text-center">Data Distribution</h4>
                        <div className="flex-1 h-56 min-w-0">
                            {!loading && stats ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieChartData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={6} dataKey="value">
                                            {pieChartData.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 italic text-caption">
                                    {loading ? 'Calculating Data...' : 'No distribution data available'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:col-span-2">
                        {/* Recent students */}
                        <div className="ui-card p-6 min-h-[360px]">
                            <h3 className="ui-label !text-slate-400 mb-4 flex items-center gap-2">
                                <Users size={14} className="text-brand" /> Recent Students Overview
                            </h3>
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                {loading ? (
                                    <p className="text-caption text-slate-400 italic py-2">Loading registrations...</p>
                                ) : !stats?.recentStudents || stats.recentStudents.length === 0 ? (
                                    <p className="text-caption text-slate-400 italic py-2">No students listed.</p>
                                ) : (
                                    stats.recentStudents.map((student) => (
                                        <div key={student.id} className="flex justify-between items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <span className="text-caption font-bold text-slate-800 uppercase truncate">
                                                {student.first_name} {student.last_name}
                                            </span>
                                            <span className="text-micro font-black px-2 py-0.5 bg-brand-soft text-brand border border-brand/10 rounded-md tracking-wider shrink-0">
                                                {student.uid || `ID-${student.id}`}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent providers */}
                        <div className="ui-card p-6 min-h-[360px]">
                            <h3 className="ui-label !text-slate-400 mb-4 flex items-center gap-2">
                                <Building2 size={14} className="text-amber-600" /> Recent Providers Overview
                            </h3>
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                {loading ? (
                                    <p className="text-caption text-slate-400 italic py-2">Loading providers...</p>
                                ) : !stats?.recentProviders || stats.recentProviders.length === 0 ? (
                                    <p className="text-caption text-slate-400 italic py-2">No providers active.</p>
                                ) : (
                                    stats.recentProviders.map((provider) => (
                                        <div key={provider.id} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <span className="text-caption font-black text-slate-800 uppercase tracking-tight truncate">
                                                {provider.name}
                                            </span>
                                            <span className="text-micro text-slate-400 font-medium truncate mt-0.5">{provider.email}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {userRole === 'root_admin' && (
                <CoAdminSection
                    coAdmins={coAdmins}
                    loading={loading}
                    onToggleStatus={handleToggleStatus}
                    onArchive={handleArchive}
                    onCreateCoAdmin={handleCreateCoAdmin}
                    onEditCoAdmin={handleUpdateCoAdmin}
                    formData={formData}
                    setFormData={setFormData}
                    editingAdmin={editingAdmin}
                    setEditingAdmin={setEditingAdmin}
                />
            )}

            {dialogElement}
        </div>
    );
}