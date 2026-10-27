import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Form, LucideScroll,
    LogOut, User, Menu, Logs, Flag, Settings, Archive
} from 'lucide-react';
import api from '../api';
import LogoutModal from '../component/LogoutModal';
import UnsavedChangesModal from '../component/UnsavedChangesModal';
import { hasUnsavedChanges, requestLeave, clearUnsavedChanges } from '../component/unsavedGuard';

export default function OrgSidebar() {
    const [role, setRole] = useState('')
    const [isExpanded, setIsExpanded] = useState(true);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [orgData, setOrgData] = useState(null);
    const [user, setUserName] = useState('')
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrgProfile = async () => {
            try {
                const res = await api.get(`/organizations/profile/me`);
                setOrgData(res.data.data);                
            } catch (err) {
                console.error("Failed to fetch org profile:", err);
            }
        };

        const fetchRole = async () => {
            try {
                const res = await api.get(`/org/role`);
                setRole(res.data.role);
                setUserName(`${res.data.first_name} ${res.data.last_name}`)
                console.log(res.data.role)
            } catch (err) {
                console.error("Failed to fetch role", err);
            }
        }
        fetchOrgProfile();
        fetchRole()
    }, []);

    const handleLogout = () => {
        clearUnsavedChanges(); // user already confirmed leaving; skip the browser prompt
        localStorage.clear();
        window.location.href = '/';
    };

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/OrgDashboard' },
        { name: 'Manage Programs', icon: <LucideScroll size={20} />, path: '/ProgramView' },
        { name: 'Manage Students', icon: <Form size={20} />, path: '/OrgApplicantPrograms' },
        { name: 'Profile', icon: <User size={20} />, path: '/OrgProfile' },
        { name: 'Reports', icon: <Flag size={20} />, path: '/OrgReports' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/OrgSettings' },
        { name: 'Logs', icon: <Logs size={20} />, path: '/OrgLogs' },
        { name: 'Archive', icon: <Archive size={20} />, path: '/OrgArchive' },
    ];

    return (
        <div className={`h-screen bg-[#FFFCFB] flex flex-col border-r border-slate-200/80 shadow-2xl relative z-40 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>

            {/* Header / Toggle Button Area */}
            <div className={`p-4 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 text-slate-500 hover:text-[#093fb4] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Profile Section */}
            <div className="px-4 mb-6 flex flex-col items-center justify-center text-center transition-all">
                <div
                    className={`relative mx-auto transition-all duration-300 ${
                        isExpanded ? 'w-24 h-24' : 'w-12 h-12'
                    }`}
                >
                    <div className="w-full h-full rounded-full border-4 border-[#093fb4]/15 overflow-hidden bg-white shadow-md flex items-center justify-center">
                        {orgData?.org_pic ? (
                            <img src={orgData.org_pic} className="w-full h-full object-cover" alt="Org Profile" />
                        ) : (
                            <User className="w-full h-full p-3 text-[#093fb4]" />
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="w-full px-2 mt-3">
                        <h3 className="text-slate-900 font-extrabold uppercase text-sm md:text-base tracking-wide truncate w-full">
                            {orgData?.org_name || "Provider"}
                        </h3>
                        {user && (
                            <p className="text-slate-700 font-semibold text-xs tracking-wide truncate mt-1 w-full">
                                {user}
                            </p>
                        )}
                        {role && (
                            <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[#093fb4]/10 text-[#093fb4] font-bold text-[10px] uppercase tracking-wider rounded-full truncate max-w-full">
                                {role.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => !(item.name === 'Logs' && role === 'co_admin') && (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        title={!isExpanded ? item.name : undefined}
                        onClick={(e) => {
                            if (!hasUnsavedChanges()) return;
                            e.preventDefault();
                            requestLeave(() => navigate(item.path));
                        }}
                        className={({ isActive }) => `
              flex items-center rounded-xl text-xs font-black uppercase tracking-wider transition-all
              ${isExpanded ? 'gap-3.5 px-4 py-3' : 'justify-center py-3 px-0'}
              ${isActive ? 'bg-[#093fb4] text-white shadow-md shadow-[#093fb4]/20' : 'text-slate-600 hover:bg-[#093fb4]/10 hover:text-[#093fb4]'}
            `}
                    >
                        <span className="shrink-0">{item.icon}</span>
                        {isExpanded && <span className="truncate">{item.name}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Logout Action */}
            <div className="p-3 border-t border-slate-200/80">
                <button
                    onClick={() => requestLeave(() => setShowLogoutDialog(true))}
                    title={!isExpanded ? "Sign Out" : undefined}
                    className={`
            w-full flex items-center rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer
            ${isExpanded
                            ? 'gap-3.5 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600'
                            : 'justify-center py-3 text-slate-600 hover:bg-red-50 hover:text-red-600'
                        }
        `}
                >
                    <LogOut size={20} className="shrink-0" />
                    {isExpanded && <span>Sign Out</span>}
                </button>
            </div>

            {/* Unsaved changes confirmation (shared by all org pages) */}
            <UnsavedChangesModal />

            {/* Reusable Logout Dialog */}
            <LogoutModal
                isOpen={showLogoutDialog}
                onClose={() => setShowLogoutDialog(false)}
                onConfirm={handleLogout}
                role="provider"
            />
        </div>
    );
}
