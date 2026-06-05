import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  RefreshCw, 
  LogIn, 
  XCircle, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  XOctagon,
  Activity,
  Globe,
  User,
  Building,
  UserCheck
} from 'lucide-react';

export default function RootAudit() {
  const [logs, setLogs] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'login'
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Combined fetch controller based on active tab focus
  const loadData = () => {
    setLoading(true);
    setErrorMessage(null);

    const endpoint = activeTab === 'audit' ? '/api/rootadmin/audit-logs' : '/api/auth/login-attempts';

    fetch(endpoint) 
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          if (activeTab === 'audit') {
            setLogs(data.logs || []);
          } else {
            setLoginAttempts(data.attempts || data.data || []);
          }
        } else {
          throw new Error(data.error || 'Backend returned success: false');
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setErrorMessage(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Reload when tab toggles
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Extended to map scholarship postings, student applications, and compliance updates
  const getBadgeConfig = (type) => {
    const config = {
      ROOT_ADMIN_LOGIN: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: LogIn, label: 'Root Login' },
      ORG_LOGIN: { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: LogIn, label: 'Org Login' },
      LOGIN_FAILED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Failed Auth' },
      SECURITY_LOCKOUT: { bg: 'bg-red-100 text-red-800 border-red-300 animate-pulse', icon: Shield, label: 'Lockout Trigger' },
      
      // Scholarship & Application Pipeline Actions
      STUDENT_APPLY: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: UserCheck, label: 'Scholarship Apply' },
      APP_APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
      APP_COMPLY: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, label: 'Compliance Request' },
      ADMIN_APPROVED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
      ADMIN_REJECTED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejected' },
      SCHOLARSHIP_TAKEDOWN: { bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: Trash2, label: 'Takedown' },
      REPORT_DISMISSED: { bg: 'bg-slate-50 text-slate-600 border-slate-200', icon: CheckCircle2, label: 'Dismissed' }
    };
    return config[type] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: AlertTriangle, label: type?.replace('_', ' ') || 'System Action' };
  };

  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'student': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'organization': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'student': return User;
      case 'organization': return Building;
      default: return Shield;
    }
  };

  // Enhanced filtering strings handling our modern joint schemas
  const filteredData = () => {
    const normalizedTerm = searchTerm.toLowerCase();
    if (activeTab === 'audit') {
      return logs.filter(log => 
        log.action_type?.toLowerCase().includes(normalizedTerm) ||
        log.details?.toLowerCase().includes(normalizedTerm) ||
        log.actor_name?.toLowerCase().includes(normalizedTerm) ||
        log.actor_email?.toLowerCase().includes(normalizedTerm) ||
        log.actor_role?.toLowerCase().includes(normalizedTerm)
      );
    } else {
      return loginAttempts.filter(attempt => 
        attempt.email?.toLowerCase().includes(normalizedTerm) ||
        attempt.ip_address?.toLowerCase().includes(normalizedTerm)
      );
    }
  };

  const displays = filteredData();

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Security & Audit Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor real-time system events, application interactions, and client authorization attempts.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'audit' ? "Search users, actions or logs..." : "Search email or IP address..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 🚀 SEGMENTED TAB SWITCHER */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('audit'); setSearchTerm(''); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          System Trails
        </button>
        <button
          onClick={() => { setActiveTab('login'); setSearchTerm(''); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'login' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <LogIn className="w-4 h-4" />
          Login Attempts
        </button>
      </div>

      {/* Error Output Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
          <XOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm">System Interruption</h5>
            <p className="text-xs text-rose-600/90 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* DYNAMIC HEADER SCHEMAS */}
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                {activeTab === 'audit' ? (
                  <>
                    <th className="p-4 w-44">Action Element</th>
                    <th className="p-4 w-56">Actor Identity</th>
                    <th className="p-4 w-32">Role</th>
                    <th className="p-4">Context Summary & Log Details</th>
                    <th className="p-4 w-48 text-right">Timestamp</th>
                  </>
                ) : (
                  <>
                    <th className="p-4">Target Identity Email</th>
                    <th className="p-4 w-48">Network Context (IP)</th>
                    <th className="p-4 w-40">Status Check</th>
                    <th className="p-4 w-48 text-right">Attempt Timestamp</th>
                  </>
                )}
              </tr>
            </thead>

            {/* DYNAMIC ROW RENDERING BASED ON TAB SELECTION */}
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded w-28" /></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded w-36" /></td>
                    <td className="p-4"><div className="h-5 bg-slate-200 rounded w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 rounded w-full" /></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : displays.length > 0 ? (
                displays.map((item) => {
                  if (activeTab === 'audit') {
                    const badge = getBadgeConfig(item.action_type);
                    const ActionIcon = badge.icon;
                    const RoleIcon = getRoleIcon(item.actor_role);
                    
                    return (
                      <tr key={`audit-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                        {/* Action Badge */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}>
                            <ActionIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>

                        {/* Actor Identity */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{item.actor_name || 'System Auto'}</div>
                          <div className="text-xs text-slate-400 font-normal">{item.actor_email || 'no-email@system'}</div>
                        </td>

                        {/* Actor Role */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${getRoleBadgeStyle(item.actor_role)}`}>
                            <RoleIcon className="w-3 h-3" />
                            {item.actor_role || 'Admin'}
                          </span>
                        </td>

                        {/* Log Details Fallback */}
                        <td className="p-4 font-normal text-slate-600 max-w-sm break-words">
                          {item.details || (
                            <span className="text-slate-400 italic text-xs">No additional metadata parameters logged.</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="p-4 text-slate-500 font-normal text-right whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={`login-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">
                          {item.email}
                        </td>
                        <td className="p-4 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {item.ip_address || '127.0.0.1'}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {item.success ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 font-normal text-right whitespace-nowrap">
                          {new Date(item.attempted_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </td>
                      </tr>
                    );
                  }
                })
              ) : (
                <tr>
                  <td colSpan={activeTab === 'audit' ? 5 : 4} className="p-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-slate-100 text-slate-400 rounded-full mb-3">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">No records located</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm ? 'Try adjusting your filter context keywords.' : 'No historic entries populated inside table.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
        
        {/* Dynamic footer summary */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs font-medium text-slate-500">
          <div>
            Showing <span className="text-slate-700">{displays.length}</span> of{' '}
            <span className="text-slate-700">
              {activeTab === 'audit' ? logs.length : loginAttempts.length}
            </span> {activeTab === 'audit' ? 'system trail logs' : 'authorization login profiles'}
          </div>
          <div className="text-slate-400 select-none">KyusISKO System Guard</div>
        </div>
      </div>
    </div>
  );
}