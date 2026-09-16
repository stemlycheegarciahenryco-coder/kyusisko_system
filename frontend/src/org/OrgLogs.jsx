import React, { useState, useEffect } from 'react';
import api from '../api';
import { History } from 'lucide-react';
import LogsPanel from './LogsPanel'; // adjust path if you move this into e.g. components/logs/

const TABS = [
  { key: 'trails', label: 'Trails' },
  { key: 'logs', label: 'Logs' },
];

export default function OrgLogs() {
  const [activeTab, setActiveTab] = useState('trails');

  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setActivityLoading(true);
        setActivityError(null);
        const res = await api.get('/organizations/activity-logs');
        setActivityLogs(res.data?.data || []);
      } catch (err) {
        console.error("Activity Logs Fetch Error:", err);
        setActivityError("Couldn't load activity logs. Please try again.");
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  // "Trails" = org/admin actions from provider_audit_trails (programs,
  // disbursements, approvals, reports, co-admin management).
  // "Logs" = student-side activity (applications, renewals — and login/
  // logout once that's tracked server-side).
  const trailLogs = activityLogs.filter(l => l.source === 'trail');
  const systemLogs = activityLogs.filter(l => l.source === 'log');

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen font-sans space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Audit Trail & System Logs <History className="text-[#093fb4]" size={22} />
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">
          Track every co-admin and system action across your organization account.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="inline-flex items-center gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-xs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-colors ${
              activeTab === tab.key
                ? 'bg-[#093fb4] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* key={activeTab} remounts LogsPanel on tab switch, resetting its
          internal search/filter/pagination state automatically. */}
      {activeTab === 'trails' ? (
        <LogsPanel
          key="trails"
          logs={trailLogs}
          loading={activityLoading}
          error={activityError}
          reportName="Audit Trail Logs"
          fileNamePrefix="audit_trail"
          emptyMessage="No audit trail records found matching your filters."
        />
      ) : (
        <LogsPanel
          key="logs"
          logs={systemLogs}
          loading={activityLoading}
          error={activityError}
          reportName="Activity Logs"
          fileNamePrefix="activity_logs"
          emptyMessage="No activity logs found matching your filters."
        />
      )}

    </div>
  );
}