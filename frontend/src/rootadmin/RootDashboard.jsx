import { useState, useMemo } from 'react';
import { UserPlus, Search, X, ShieldCheck, Lock as IconLock, Archive, Trash2, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CoAdminSection({
    coAdmins = [],
    loading,
    onToggleStatus,
    onArchive,
    onDeleteCoAdmin,
    onCreateCoAdmin,
    onSnapshotsClick,
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
        });

        if (result.isConfirmed) {
            onArchive(admin);
        }
    };

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
        <section className="bg-white p-8 rounded-[2.5rem] border border-blue-200 shadow-sm space-y-6">
            {/* Section Header with Title and Snapshots Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 m-0">
                    <UserPlus className="text-blue-600" size={18} /> Co-Admin Management
                </h2>
                
                <button
                    type="button"
                    onClick={onSnapshotsClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-blue-200 shadow-sm"
                >
                    <Clock size={15} />
                    Snapshots
                </button>
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

                    {/* Filter Tab Buttons with Counts */}
                    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
                        {['all', 'active', 'blocked', 'archived'].map((tab) => {
                            const isActiveTab = activeTab === tab;
                            const count = tabCounts[tab] || 0;

                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                                        isActiveTab
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-150'
                                    }`}
                                >
                                    <span>{tab}</span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                                        isActiveTab ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
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
                                                    className={`flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                                                        admin.account_status === 'active'
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
