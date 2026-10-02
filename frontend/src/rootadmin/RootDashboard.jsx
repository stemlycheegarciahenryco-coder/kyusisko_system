import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, ClipboardList, UserCog, GraduationCap, UserPlus, Building2, Trash2, Filter, Archive, UnlockIcon } from 'lucide-react';
import api from '../api';
import { IconLock } from '@tabler/icons-react';
import Swal from 'sweetalert2';

const STAT_CARDS = [
    { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { key: 'totalSubAdmins', label: 'Active Orgs', icon: UserCog, color: 'bg-amber-50 text-amber-600' },
    { key: 'totalScholarships', label: 'Scholarship Programs', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'totalApplications', label: 'Total Applications', icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
];

export default function RootDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Co-Admin Feature Management States
    const [coAdmins, setCoAdmins] = useState([]);
    const [filterStatus, setFilterStatus] = useState('active'); // Options: 'all', 'active', 'suspended', 'deleted'
    const [filterArchived, setFilterArchived] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });

    const userRole = localStorage.getItem('userRole') || 'co_admin';
    const PIE_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#7c3aed'];

    useEffect(() => {
        fetchStatsAndAdmins();
    }, []);

    const fetchStatsAndAdmins = async () => {
        try {
            setLoading(true);
            const resStats = await api.get('/stats');
            setStats(resStats.data);
            await fetchAdmins();
        } catch (err) {
            console.error("Failed to load root parameters:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error Loading Data',
                text: 'Failed to retrieve dashboard parameters. Please refresh or try again.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        if (userRole === 'root_admin') {
            try {
                const resAdmins = await api.get('/system-admin/co-admins');
                if (resAdmins.data.success) {
                    setCoAdmins(resAdmins.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch co-admins:", err);
            }
        }
    }; 

    const handleCreateCoAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/system-admin/create-co-admin', formData);
            if (response.data.success) {
                const createdAdmin = response.data.data;
                setCoAdmins([{ ...createdAdmin, account_status: createdAdmin.account_status || 'active' }, ...coAdmins]);
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

        const confirm = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${actionText} this Co-Admin account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: currentStatus === 'active' ? '#dc2626' : '#16a34a',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Yes, ${actionText}`
        });

        if (!confirm.isConfirmed) return;

        try {
            const response = await api.patch(`/system-admin/toggle-status/${id}`, { status: nextStatus });
            if (response.data.success) {
                setCoAdmins(coAdmins.map(admin => admin.id === id ? { ...admin, account_status: nextStatus } : admin));

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
        const confirm = await Swal.fire({
            title: 'Delete Co-Admin Account?',
            text: 'This action cannot be undone. Are you sure you want to delete this account?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete'
        });

        if (!confirm.isConfirmed) return;

        try {
            const response = await api.delete(`/system-admin/co-admins/${id}`);
            if (response.data.success || response.status === 200) {
                setCoAdmins(coAdmins.map(admin => admin.id === id ? { ...admin, account_status: 'deleted' } : admin));

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
            await api.patch(`/system-admin/archive/${admin.id}`);
            Swal.fire({ title: 'Status Updated', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchAdmins();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Action failed.', 'error');
            console.error(err);
        }
    };

    // Cached filtered co-admins calculation for optimized re-renders
    const filteredCoAdmins = useMemo(() => {
        return coAdmins.filter(admin => {
            const isArchived = Boolean(admin.is_archived);
            const matchesArchive = filterArchived ? isArchived : !isArchived;
            if (filterStatus === 'all') return admin.account_status !== 'deleted' && matchesArchive;
            return admin.account_status === filterStatus && matchesArchive;
        });
    }, [coAdmins, filterStatus, filterArchived]);

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
                                            data={[
                                                { name: 'Students', value: stats.totalStudents || 0 },
                                                { name: 'Organizations', value: stats.totalSubAdmins || 0 },
                                                { name: 'Scholarships', value: stats.totalScholarships || 0 },
                                            ]}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={6}
                                            dataKey="value"
                                        >
                                            {PIE_COLORS.map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} stroke="none" />
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

            {/* Bottom Co-Admin Management Section */}
            {userRole === 'root_admin' && (
                <section className="bg-white p-8 rounded-[2.5rem] border border-blue-200 shadow-sm">
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <UserPlus className="text-blue-600" size={18} /> Co-Admin Management
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Creation Form */}
                        <form onSubmit={handleCreateCoAdmin} className="space-y-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8">
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
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Co-Admins List
                                </p>
                                <div className="flex items-center gap-3">
                                    {/* Checkbox */}
                                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="filter-checkbox"
                                            checked={filterArchived}
                                            className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-0 cursor-pointer"
                                            onChange={(e) => setFilterArchived(e.target.checked)}
                                        />
                                        <label htmlFor="filter-checkbox" className="cursor-pointer text-xs font-semibold uppercase select-none">
                                            Show Archive
                                        </label>
                                    </div>

                                    {/* Filter Dropdown */}
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                        <Filter size={14} className="text-slate-400" />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer uppercase"
                                        >
                                            <option value="all">All</option>
                                            <option value="active">Active</option>
                                            <option value="suspended">Blocked</option>
                                            <option value="deleted">Deleted</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Co-Admins List */}
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                {loading ? (
                                    <p className="text-xs font-medium text-slate-400 italic text-center py-4">Loading administrators...</p>
                                ) : filteredCoAdmins.length === 0 ? (
                                    <p className="text-xs font-medium text-slate-400 italic py-4 text-center">
                                        No {filterStatus === 'all' ? '' : filterStatus} co-admins found.
                                    </p>
                                ) : (
                                    filteredCoAdmins.map((admin) => (
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
                                                {admin.account_status === 'deleted' ? (
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-red-100 text-red-600">
                                                        Deleted
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(admin.id, admin.account_status)}
                                                            className={`flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                                                                admin.account_status === 'active'
                                                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            }`}
                                                        >
                                                            {admin.account_status === 'active' ? (
                                                                <IconLock size={12} />
                                                            ) : (
                                                                <UnlockIcon size={12} />
                                                            )}
                                                            {admin.account_status === 'active' ? 'Block' : 'Unblock'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                            onClick={() => handleArchive(admin)}
                                                        >
                                                            <Archive size={12} />
                                                            {Boolean(admin.is_archived) ? 'Unarchive' : 'Archive'}
                                                        </button>

                                                        {/* Only render Delete button if the account status is blocked/suspended */}
                                                        {admin.account_status === 'suspended' && (
                                                            <button
                                                                type="button"
                                                                className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                                                onClick={() => handleDeleteCoAdmin(admin.id)}
                                                            >
                                                                <Trash2 size={12} />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
