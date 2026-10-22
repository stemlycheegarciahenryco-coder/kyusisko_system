import { useState, useEffect } from 'react';
import api from '../api';
import { Search, ShieldCheck, Lock, Phone, MapPin, Mail, Archive, Trash2, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function RootStudentLog() {
    const [students, setStudents] = useState([]);
    const [archivedStudents, setArchivedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [snapshotIsVisible, setSnapshotVisible] = useState(false);
    const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
    const [snapShotLists, setSnapshotList] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch regular and archived students concurrently
            const [studentsRes, archivedRes] = await Promise.all([
                api.get('/students'),
                api.get('/system-admin/get/student/archive/')
            ]);

            setStudents(studentsRes.data);
            setArchivedStudents(archivedRes.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatus = async (id, currentActiveStatus) => {
        const newStatus = !currentActiveStatus;
        const actionText = newStatus ? 'Unblock' : 'Block';

        const result = await Swal.fire({
            title: `${actionText} Student?`,
            text: `Confirm you want to ${actionText.toLowerCase()} this account's access.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#093fb4' : '#FF1E1E',
            confirmButtonText: `Yes, ${actionText}!`,
        });

        if (!result.isConfirmed) return;

        try {
            await api.patch(`/students/${id}/status`, { activeStatus: newStatus });
            setStudents(prev => prev.map(s => s.id === id ? { ...s, sis_active: newStatus } : s));
            setArchivedStudents(prev => prev.map(s => s.id === id ? { ...s, sis_active: newStatus } : s));
            Swal.fire({ title: 'Success!', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ title: 'Error!', icon: 'error' });
        }
    };

    const handleArchive = async (id, currentArchiveStatus) => {
        const newArchiveStatus = !currentArchiveStatus;
        const actionText = newArchiveStatus ? 'Archive' : 'Unarchive';

        const result = await Swal.fire({
            title: `${actionText} Student?`,
            text: `Confirm you want to ${actionText.toLowerCase()} this student record.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            confirmButtonText: `Yes, ${actionText}!`,
        });

        if (!result.isConfirmed) return;

        try {
            await api.patch(`/system-admin/student/archive/${id}`, { isArchived: newArchiveStatus });
            await fetchAllData();
            Swal.fire({ title: 'Success!', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ title: 'Error!', text: 'Failed to update archive status.', icon: 'error' });
        }
    };

    const handleDelete = async (student) => {
        const studentFullName = `${student.sfirst_name || ''} ${student.slast_name || ''}`.trim();

        const { value: formValues } = await Swal.fire({
            title: `Delete ${studentFullName}?`,
            text: `Please type the student's name ("${studentFullName}") and enter your admin password to confirm permanent deletion.`,
            html: `
                <div style="text-align: left; margin-top: 10px;">
                    <label style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">
                        Confirm Student Name
                    </label>
                    <input id="swal-input-name" class="swal2-input" placeholder="Enter student name" style="margin: 0 0 15px 0; width: 100%; box-sizing: border-box; font-size: 14px;" />
                    
                    <label style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">
                        Admin Password
                    </label>
                    <input id="swal-input-password" type="password" class="swal2-input" placeholder="Enter admin password" style="margin: 0; width: 100%; box-sizing: border-box; font-size: 14px;" />
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#FF1E1E',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Delete Permanently',
            background: '#ffffff',
            color: '#0f172a',
            preConfirm: () => {
                const enteredName = document.getElementById('swal-input-name').value;
                const password = document.getElementById('swal-input-password').value;

                if (enteredName !== studentFullName) {
                    Swal.showValidationMessage('The student name you entered does not match.');
                    return false;
                }
                if (!password) {
                    Swal.showValidationMessage('Please enter your admin password.');
                    return false;
                }
                return { password };
            }
        });

        if (formValues) {
            try {
                await api.delete(`/students/${student.id}`, {
                    data: { password: formValues.password }
                });

                setArchivedStudents(prev => prev.filter(s => s.id !== student.id));
                await fetchAllData();
                
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Student record has been removed.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#ffffff',
                    color: '#0f172a',
                });
            } catch (err) {
                Swal.fire({
                    title: 'Error!',
                    text: err.response?.data?.error || 'Failed to delete student. Incorrect password or action failed.',
                    icon: 'error',
                    background: '#ffffff',
                    color: '#0f172a',
                    confirmButtonColor: '#093fb4',
                });
            }
        }
    };

    const onSnapshotsClick = async () => { setSnapshotVisible(!snapshotIsVisible) };

    // Determine current dataset based on active tab
    const currentDataset = 
        activeTab === 'archived' ? archivedStudents : 
        students;

    // Calculate accurate preloaded counts across variables
    const counts = {
        all: students.filter(s => !s.is_archived).length,
        active: students.filter(s => s.sis_active && !s.is_archived).length,
        blocked: students.filter(s => !s.sis_active && !s.is_archived).length,
        archived: archivedStudents.length,
    };

    const filtered = currentDataset.filter(s => {
        const fullName = `${s.sfirst_name || ''} ${s.slast_name || ''}`.toLowerCase();
        const email = (s.student_email || '').toLowerCase();
        const matchesSearch = fullName.includes(search.toLowerCase()) || email.includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'active') return s.sis_active;
        if (activeTab === 'blocked') return !s.sis_active;

        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 bg-[#FFFCFB] min-h-screen p-4">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-[#093fb4]/10 shadow-sm">
                <div>
                    <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">
                        Student Management
                    </h2>
                </div>
                
                <div className="px-5 py-3 rounded-2xl border border-[#093fb4] bg-white shadow-sm self-start md:self-auto">
                    <p className="text-xl font-black leading-none text-[#093fb4]">{students.length + archivedStudents.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black mt-1">Total Student Registered</p>
                </div>
            </div>

            {/* SEARCH, STATUS TABS, AND SNAPSHOTS BUTTON CONTAINER */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* SEARCH */}
                <div className="relative w-full lg:max-w-md">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40" />
                    <input
                        placeholder="Search student identity..."
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-[#093fb4]/20 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#093fb4]/10 text-black font-medium"
                    />
                </div>

                {/* RIGHT SIDE: STATUS VIEW TABS */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] border border-[#093fb4]/10 shadow-sm overflow-x-auto">
                        {['all', 'active', 'blocked', 'archived'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${activeTab === tab
                                    ? 'bg-[#093fb4] text-white shadow-sm'
                                    : 'text-black/65 hover:text-black hover:bg-black/5'
                                    }`}
                            >
                                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-black/5 text-black/70'
                                    }`}>
                                    {counts[tab]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-[2.5rem] border border-[#093fb4]/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#093fb4]/5 border-b border-[#093fb4]/10">
                                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Student</th>
                                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Contact & Email</th>
                                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Address</th>
                                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest">Status</th>
                                <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#093fb4]/5">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-20 text-black font-bold uppercase tracking-widest">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-20 text-black/50 font-bold uppercase tracking-widest">No students found.</td></tr>
                            ) : (
                                filtered.map(s => (
                                    <tr key={s.id} className="hover:bg-[#FFFCFB] transition-all group">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#093fb4] flex items-center justify-center text-white font-black text-xs">
                                                    {s.sfirst_name?.[0]}{s.slast_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-black text-sm uppercase">{s.sfirst_name} {s.slast_name}</p>
                                                    <p className="text-[10px] text-black/40 font-bold">ID: #{s.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-black/60">
                                                    <Mail size={12} className="text-[#093fb4]" />
                                                    <span className="text-[11px] font-bold">{s.student_email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-black/60">
                                                    <Phone size={12} className="text-[#093fb4]" />
                                                    <span className="text-[11px] font-bold">{s.scontact_number}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-start gap-2 max-w-[200px]">
                                                <MapPin size={12} className="text-[#FF1E1E] mt-1 shrink-0" />
                                                <span className="text-[11px] font-medium text-black/70 leading-tight">
                                                    {s.full_address || 'No Address Provided'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.sis_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={`text-[10px] font-black uppercase ${s.sis_active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {s.sis_active ? 'Active' : 'Blocked'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {/* Block / Unblock Button */}
                                                {activeTab !== 'archived' && (
                                                    <button
                                                        onClick={() => handleStatus(s.id, s.sis_active)}
                                                        title={s.sis_active ? 'Block Student' : 'Unblock Student'}
                                                        className={`flex items-center gap-2 p-3 text-[10px] font-black uppercase rounded-2xl border shadow-md hover:scale-110 transition-all cursor-pointer ${!s.sis_active
                                                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                                            : 'bg-blue-600/10 text-blue-600 border-blue-600/20 hover:bg-blue-600 hover:text-white'
                                                            }`}
                                                    >
                                                        {!s.sis_active ? <ShieldCheck size={16} /> : <Lock size={16} />}
                                                        <span>{s.sis_active ? 'Block' : 'Unblock'}</span>
                                                    </button>
                                                )}

                                                {/* Archive / Unarchive Button */}
                                                <button
                                                    onClick={() => handleArchive(s.id, s.is_archived)}
                                                    title={s.is_archived ? 'Unarchive Student' : 'Archive Student'}
                                                    className={`flex items-center gap-2 p-3 text-[10px] font-black uppercase rounded-2xl border shadow-md hover:scale-110 transition-all cursor-pointer ${s.is_archived
                                                        ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                                                        : 'bg-amber-600/10 text-amber-600 border-amber-600/20 hover:bg-amber-600 hover:text-white'
                                                        }`}
                                                >
                                                    <Archive size={16} />
                                                    <span>{s.is_archived ? 'Unarchive' : 'Archive'}</span>
                                                </button>

                                                {/* Delete Button (Only shows in Archived Tab) */}
                                                {activeTab === 'archived' && (
                                                    <button
                                                        onClick={() => handleDelete(s)}
                                                        title="Delete Student Permanently"
                                                        className="flex items-center gap-2 p-3 text-[10px] font-black uppercase rounded-2xl border shadow-md hover:scale-110 transition-all cursor-pointer bg-red-600/10 text-red-600 border-red-600/20 hover:bg-red-600 hover:text-white"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
