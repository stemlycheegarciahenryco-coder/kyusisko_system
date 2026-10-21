import { useEffect, useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, ClipboardList, UserCog, GraduationCap, UserPlus, Building2, Trash2, Filter, Archive, UnlockIcon, Search, X, ShieldCheck, Camera, Clock1Icon } from 'lucide-react';
import api from '../api';
import { IconLock } from '@tabler/icons-react';
import Swal from 'sweetalert2';

const STAT_CARDS = [
    { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { key: 'totalSubAdmins', label: 'Active Orgs', icon: UserCog, color: 'bg-amber-50 text-amber-600' },
    { key: 'totalScholarships', label: 'Scholarship Programs', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'totalApplications', label: 'Total Applications', icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
];

const CHART_CONFIG = [
    { key: 'totalStudents', name: 'Students', color: '#2563eb' },
    { key: 'totalSubAdmins', name: 'Organizations', color: '#f59e0b' },
    { key: 'totalScholarships', name: 'Scholarships', color: '#10b981' },
];

function CoAdminSection({
    coAdmins = [],
    loading,
    onToggleStatus,
    onArchive,
    onDeleteCoAdmin,
    onCreateCoAdmin,
    formData,
    setFormData
}) {
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'blocked' | 'archived'
    const [searchQuery, setSearchQuery] = useState('');

    // Handle Archive click with SweetAlert confirmation
    const handleArchiveClick = async (admin) => {
        const isArchived = Boolean(admin.is_archived);
        const actionText = isArchived ? 'Unarchive' : 'Archive';

        const result = await Swal.fire({
            title: `${actionText} Co-Admin?`,
            text: `Confirm you want to ${actionText.toLowerCase()} this co-admin record.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            confirmButtonText: `Yes, ${actionText}!`,
        }, '#d97706');

        if (result.isConfirmed) {
            onArchive(admin);
        }
    };

    const [snapshotIsVisible, setSnapshotVisible] = useState(false)
    const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
    const [snapShotLists, setSnapshotList] = useState([])

    const onSnapshotsClick = async () => { setSnapshotVisible(!snapshotIsVisible) }

    // Pre-calculate counts and filtered list for each tab based on the current searchQuery
    const { filteredCoAdmins, tabCounts } = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        let allCount = 0;
        let activeCount = 0;
        let blockedCount = 0;
        let archivedCount = 0;

        const matchedList = [];

        coAdmins.forEach(admin => {
            const isArchived = Boolean(admin.is_archived);
            const isDeleted = admin.account_status === 'deleted';

            // Skip entirely if deleted
            if (isDeleted) return;

            const isBlocked = admin.account_status === 'suspended';
            const isActive = admin.account_status === 'active' && !isArchived;

            const isAll = !isArchived;
            const isTabActive = isActive;
            const isTabBlocked = isBlocked && !isArchived;
            const isTabArchived = isArchived;

            // Search filter check
            const fullName = `${admin.first_name || ''} ${admin.last_name || ''}`.toLowerCase();
            const email = (admin.email || '').toLowerCase();
            const uid = (admin.uid || '').toLowerCase();
            const matchesSearch = !query || fullName.includes(query) || email.includes(query) || uid.includes(query);

            // Increment totals if they match search query (so tab counts reflect the active search)
            if (matchesSearch) {
                if (isAll) allCount++;
                if (isTabActive) activeCount++;
                if (isTabBlocked) blockedCount++;
                if (isTabArchived) archivedCount++;
            }

            // Determine if it matches the currently selected active tab
            let matchesTab = false;
            if (activeTab === 'all') matchesTab = isAll;
            else if (activeTab === 'active') matchesTab = isTabActive;
            else if (activeTab === 'blocked') matchesTab = isTabBlocked;
            else if (activeTab === 'archived') matchesTab = isTabArchived;

            if (matchesTab && matchesSearch) {
                matchedList.push(admin);
            }
        });

        return {
            filteredCoAdmins: matchedList,
            tabCounts: {
                all: allCount,
                active: activeCount,
                blocked: blockedCount,
                archived: archivedCount,
            }
        };
    }, [coAdmins, activeTab, searchQuery]);

    return (
        <section className="bg-white p-8 rounded-[2.5rem] border border-blue-200 shadow-sm">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 m-0">
                    <UserPlus className="text-blue-600" size={18} /> Co-Admin Management
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Creation Form */}
                <form onSubmit={onCreateCoAdmin} className="space-y-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Register New Co-Admin
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="First Name"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                        />
                    </div>
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600 text-slate-800"
                    />

                    <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
                    >
                        Create Co-Admin Account
                    </button>
                </form>

                {/* Co-Admins Status & List Table View */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                            Co-Admins List
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search Bar Input */}
                            <div className="relative flex-1 min-w-[180px] sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 focus-within:border-blue-600 focus-within:bg-white transition-all">
                                <Search size={14} className="text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search co-admin..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filter Tab Buttons with Counts & Snapshots Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                            {['all', 'active', 'blocked', 'archived'].map((tab) => {
                                const isActiveTab = activeTab === tab;
                                const count = tabCounts[tab] || 0;

                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${isActiveTab
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-150'
                                            }`}
                                    >
                                        <span>{tab}</span>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${isActiveTab ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={onSnapshotsClick}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#093fb4] font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-blue-200 shadow-sm"
                        >
                            <Clock1Icon size={14} className="text-slate-500" />
                            Snapshots
                        </button>
                    </div>

                    {/* Co-Admins List */}
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {loading ? (
                            <p className="text-xs font-medium text-slate-400 italic text-center py-4">Loading administrators...</p>
                        ) : filteredCoAdmins.length === 0 ? (
                            <p className="text-xs font-medium text-slate-400 italic py-4 text-center">
                                {searchQuery
                                    ? `No co-admins matching "${searchQuery}"`
                                    : `No ${activeTab === 'all' ? '' : activeTab} co-admins found.`}
                            </p>
                        ) : (
                            filteredCoAdmins.map((admin) => {
                                const isArchived = Boolean(admin.is_archived);

                                return (
                                    <div key={admin.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors gap-4 shadow-sm">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">
                                                    {admin.first_name} {admin.last_name}
                                                </p>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md tracking-wider">
                                                    {admin.uid}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium truncate">
                                                {admin.email}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {!isArchived && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleStatus(admin.id, admin.account_status)}
                                                    className={`flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${admin.account_status === 'active'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                                                        }`}
                                                >
                                                    {admin.account_status === 'active' ? (
                                                        <IconLock size={12} />
                                                    ) : (
                                                        <ShieldCheck size={12} />
                                                    )}
                                                    {admin.account_status === 'active' ? 'Block' : 'Unblock'}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                onClick={() => handleArchiveClick(admin)}
                                            >
                                                <Archive size={12} />
                                                {isArchived ? 'Unarchive' : 'Archive'}
                                            </button>

                                            {isArchived && (
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                                    onClick={() => onDeleteCoAdmin(admin.id)}
                                                >
                                                    <Trash2 size={12} />
                                                    Delete
                                                </button>
                                            )}
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
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });

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
            console.error("Failed to load dashboard data:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error Loading Data',
                text: 'Failed to retrieve dashboard parameters. Please refresh or try again.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
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
                    account_status: createdAdmin.account_status || 'active'
                };

                setCoAdmins(prev => [normalizedAdmin, ...prev]);
                setFormData({ firstName: '', lastName: '', email: '', password: '' });

                Swal.fire({
                    icon: 'success',
                    title: 'Co-Admin Created',
                    text: `Account successfully registered! Generated ID: ${createdAdmin.uid || createdAdmin.id}`,
                    confirmButtonColor: '#2563eb'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: err.response?.data?.message || 'Failed to register account.',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const actionText = currentStatus === 'active' ? 'block' : 'unblock';
        const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const confirmColor = currentStatus === 'active' ? '#dc2626' : '#2563eb'
        const confirm = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${actionText} this Co-Admin account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: '#64748b',
            confirmButtonText: `Yes, ${actionText}`
        });

        if (!confirm.isConfirmed) return;

        try {
            const response = await api.patch(`/system-admin/toggle-status/${id}`, { status: nextStatus });
            if (response.data.success) {
                setCoAdmins(prev => prev.map(admin => admin.id === id ? { ...admin, account_status: nextStatus } : admin));

                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Account has been successfully ${nextStatus === 'suspended' ? 'blocked' : 'unblocked'}.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error("Could not complete requested state transition:", err);
            Swal.fire({
                icon: 'error',
                title: 'Action Failed',
                text: err.response?.data?.message || 'Could not update account status.',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleDeleteCoAdmin = async (id) => {
        // Step 1: Initial Delete Confirmation
        const confirm = await Swal.fire({
            title: 'Delete Co-Admin Account?',
            text: 'This action cannot be undone. Are you sure you want to delete this account?',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#FF1E1E',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete'
        });

        if (!confirm.isConfirmed) return;

        // Step 2: Prompt for Snapshot
        const snapshotConfirm = await Swal.fire({
            title: 'Create Snapshot?',
            text: 'Would you like to create a snapshot of this account before deleting it?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, create snapshot',
            cancelButtonText: 'No, skip'
        });

        // Step 3: Optional Snapshot API Call
        if (snapshotConfirm.isConfirmed) {
            try {
                await api.post(`/system-admin/co-admins/snapshot/${id}`);
                // Optional: add a success toast or alert for the snapshot if desired
            } catch (snapshotErr) {
                console.error("Failed to create snapshot:", snapshotErr);
                // You can choose whether to abort deletion or just let it continue
            }
        }

        // Step 4: Proceed with Deletion
        try {
            const response = await api.delete(`/system-admin/co-admins/delete/${id}`);
            if (response.data.success || response.status === 200) {
                setCoAdmins(prev => prev.map(admin => admin.id === id ? { ...admin, account_status: 'deleted' } : admin));

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Co-Admin account has been deleted.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error("Failed to delete co-admin:", err);
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: err.response?.data?.message || 'Failed to delete account.',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleArchive = async (admin) => {
        try {
            const response = await api.patch(`/system-admin/archive/${admin.id}`);
            if (response.data.success || response.status === 200) {
                setCoAdmins(prev => prev.map(item => item.id === admin.id ? { ...item, is_archived: !item.is_archived } : item));
                Swal.fire({ title: 'Status Updated', icon: 'success', timer: 1500, showConfirmButton: false });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Action failed.', 'error');
            console.error(err);
        }
    };

    const pieChartData = useMemo(() => {
        if (!stats) return [];
        return CHART_CONFIG.map(cfg => ({
            name: cfg.name,
            value: stats[cfg.key] || 0,
            color: cfg.color
        }));
    }, [stats]);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-['Inter']">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
                        System Admin<span className="text-blue-600"> Dashboard</span>
                    </h1>
                </div>
            </div>

            {/* Top Overview Workspace */}
            <div className="space-y-6">
                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map((card) => (
                        <div key={card.key} className="bg-white p-6 rounded-[2rem] border border-blue-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}>
                                    <card.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                                    <p className="text-2xl font-black text-slate-800">{loading ? '...' : stats?.[card.key] ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pie Chart & Analytics Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                    {/* Pie Chart */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-blue-400 shadow-sm flex flex-col justify-between min-h-[360px] xl:col-span-1">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">
                                Data Distribution
                            </h4>
                        </div>
                        <div className="flex-1 h-56 min-w-0">
                            {!loading && stats ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={6}
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 italic text-xs">
                                    {loading ? "Calculating Data..." : "No distribution data available"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Items Overview Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:col-span-2">
                        {/* Recent Students */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Users size={14} className="text-blue-600" /> Recent Students Overview
                                </h3>
                                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                    {loading ? (
                                        <p className="text-xs text-slate-400 italic py-2">Loading registrations...</p>
                                    ) : !stats?.recentStudents || stats.recentStudents.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-2">No students listed.</p>
                                    ) : (
                                        stats.recentStudents.map((student) => (
                                            <div key={student.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <span className="text-xs font-bold text-slate-800 uppercase truncate max-w-[130px]">
                                                    {student.first_name} {student.last_name}
                                                </span>
                                                <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md tracking-wider">
                                                    {student.uid || `ID-${student.id}`}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Providers */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Building2 size={14} className="text-amber-600" /> Recent Providers Overview
                                </h3>
                                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                    {loading ? (
                                        <p className="text-xs text-slate-400 italic py-2">Loading providers...</p>
                                    ) : !stats?.recentProviders || stats.recentProviders.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-2">No providers active.</p>
                                    ) : (
                                        stats.recentProviders.map((provider) => (
                                            <div key={provider.id} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                                                    {provider.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                                    {provider.email}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Co-Admin Management Component */}
            {userRole === 'root_admin' && (
                <CoAdminSection
                    coAdmins={coAdmins}
                    loading={loading}
                    onToggleStatus={handleToggleStatus}
                    onArchive={handleArchive}
                    onDeleteCoAdmin={handleDeleteCoAdmin}
                    onCreateCoAdmin={handleCreateCoAdmin}
                    formData={formData}
                    setFormData={setFormData}
                />
            )}
        </div>
    );
}
