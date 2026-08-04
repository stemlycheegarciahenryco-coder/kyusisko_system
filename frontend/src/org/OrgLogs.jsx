import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  BookOpen, 
  CheckCircle2, 
  Download, 
  Search, 
  History, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  Clock, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';

export default function OrgLogs() {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'activity'
  const [logFilter, setLogFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Sample Fund Allocation Data ──────────────────────────────────────────
  const fundData = [
    { id: 1, program: 'STI College Scholarship Program', totalFund: 500000, disbursed: 350000, beneficiaries: 35, status: 'Active' },
    { id: 2, program: 'HSLAM Grant', totalFund: 300000, disbursed: 240000, beneficiaries: 24, status: 'Active' },
    { id: 3, program: 'Muslim Scholarship for Education', totalFund: 250000, disbursed: 180000, beneficiaries: 18, status: 'Active' },
    { id: 4, program: 'ISAPA Program', totalFund: 200000, disbursed: 150000, beneficiaries: 15, status: 'Active' },
    { id: 5, program: 'CHED Merit Scholarship', totalFund: 400000, disbursed: 0, beneficiaries: 0, status: 'Draft' },
  ];

  // Calculated Totals
  const totalAllocatedFund = fundData.reduce((acc, item) => acc + item.totalFund, 0);
  const totalDisbursedFund = fundData.reduce((acc, item) => acc + item.disbursed, 0);
  const totalRemainingFund = totalAllocatedFund - totalDisbursedFund;
  const totalApprovedStudents = fundData.reduce((acc, item) => acc + item.beneficiaries, 0);

  // ── Sample Course Demographics Data ──────────────────────────────────────
  const courseDemographics = [
    { course: 'BS Information Technology', count: 38, percentage: 41.3, color: 'bg-blue-600' },
    { course: 'BS Computer Science', count: 24, percentage: 26.1, color: 'bg-purple-600' },
    { course: 'BS Business Administration', count: 15, percentage: 16.3, color: 'bg-emerald-500' },
    { course: 'BS Accountancy', count: 9, percentage: 9.8, color: 'bg-amber-500' },
    { course: 'BS Civil Engineering', count: 6, percentage: 6.5, color: 'bg-rose-500' },
  ];

  // ── Sample Account Activity Logs ─────────────────────────────────────────
  const userLogs = [
    { id: 1, user: 'Admin User', role: 'Main Admin', type: 'LOGIN', detail: 'Logged in successfully from IP 192.168.1.15', time: '10 mins ago', date: '2026-08-04 15:39' },
    { id: 2, user: 'Org Staff (Sarah)', role: 'Sub-Admin', type: 'APPROVE', detail: 'Approved application for student #2026-8812', time: '25 mins ago', date: '2026-08-04 15:24' },
    { id: 3, user: 'Org Staff (Sarah)', role: 'Sub-Admin', type: 'FUND_UPDATE', detail: 'Disbursed ₱10,000 for STI College Scholarship', time: '1 hour ago', date: '2026-08-04 14:49' },
    { id: 4, user: 'Admin User', role: 'Main Admin', type: 'SETTINGS', detail: 'Updated program deadline for HSLAM Grant', time: '3 hours ago', date: '2026-08-04 12:15' },
    { id: 5, user: 'Org Staff (John)', role: 'Sub-Admin', type: 'LOGOUT', detail: 'User logged out', time: '5 hours ago', date: '2026-08-04 10:30' },
    { id: 6, user: 'Org Staff (John)', role: 'Sub-Admin', type: 'LOGIN', detail: 'Logged in successfully from IP 192.168.1.22', time: '7 hours ago', date: '2026-08-04 08:30' },
  ];

  const filteredLogs = userLogs.filter(log => {
    const matchesFilter = logFilter === 'ALL' || log.type === logFilter;
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen font-sans space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Reports & Activity Logs <History className="text-blue-600" size={22} />
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Audit organization finances, applicant demographics, and user account actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all"
          >
            <Download size={15} /> Export PDF
          </button>
          <button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <FileSpreadsheet size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart size={16} /> Reports & Analytics
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={16} /> User Activity & System Logs
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: REPORTS & ANALYTICS                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Students Approved */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">Approved Students</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{totalApprovedStudents}</p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1">+12% from last term</p>
                </div>
              </div>
            </div>

            {/* Totality of Allocated Funds */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <DollarSign size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">Total Allocated Budget</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">₱{totalAllocatedFund.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-blue-600 mt-1">Across {fundData.length} Programs</p>
                </div>
              </div>
            </div>

            {/* Total Disbursed Funds */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">Disbursed Funds</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">₱{totalDisbursedFund.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-purple-600 mt-1">{((totalDisbursedFund / totalAllocatedFund) * 100).toFixed(1)}% Disbursed</p>
                </div>
              </div>
            </div>

            {/* Remaining Fund Balance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                  <DollarSign size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">Remaining Balance</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">₱{totalRemainingFund.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-amber-600 mt-1">Available for allocation</p>
                </div>
              </div>
            </div>

          </div>

          {/* Grid Layout: Fund Allocation Table & Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Fund Allocation Per Program Report (2 Columns Wide) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Program Fund Allocation Report</h2>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Detailed breakdown of budget and disbursement per scholarship program</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                        <th className="pb-3 px-2">Program Name</th>
                        <th className="pb-3 px-2 text-right">Allocated</th>
                        <th className="pb-3 px-2 text-right">Disbursed</th>
                        <th className="pb-3 px-2 text-center">Approved Students</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                      {fundData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-2 font-bold text-slate-900">{item.program}</td>
                          <td className="py-3 px-2 text-right font-extrabold text-slate-900">₱{item.totalFund.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right text-emerald-600 font-extrabold">₱{item.disbursed.toLocaleString()}</td>
                          <td className="py-3 px-2 text-center font-black text-slate-800">{item.beneficiaries}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              item.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totality Summary Bar */}
              <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-tight">Totality of Funds Summary</span>
                <div className="flex items-center gap-6 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 font-medium">Total: </span>
                    <span className="text-slate-900 font-black">₱{totalAllocatedFund.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Disbursed: </span>
                    <span className="text-emerald-600 font-black">₱{totalDisbursedFund.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Demographics Card (1 Column Wide) */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Course Demographics</h2>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Approved applicants by course</p>
                  </div>
                  <BookOpen size={18} className="text-blue-600" />
                </div>

                <div className="space-y-4 my-2">
                  {courseDemographics.map((cd, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700 truncate max-w-[180px]">{cd.course}</span>
                        <span className="text-slate-900 font-black">{cd.count} <span className="text-[10px] font-semibold text-slate-400">({cd.percentage}%)</span></span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${cd.color} rounded-full transition-all duration-500`} 
                          style={{ width: `${cd.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-50 text-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Total Enrolled Demographics: {totalApprovedStudents} Students
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: USER ACTIVITY & LOGIN LOGS                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          
          {/* Controls Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search user or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-slate-400" />
              <span className="text-xs font-extrabold text-slate-600">Filter:</span>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="LOGIN">Logins</option>
                <option value="LOGOUT">Logouts</option>
                <option value="APPROVE">Approvals</option>
                <option value="FUND_UPDATE">Fund Changes</option>
                <option value="SETTINGS">Settings Changes</option>
              </select>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                  <th className="pb-3 px-3">User & Role</th>
                  <th className="pb-3 px-3">Action Type</th>
                  <th className="pb-3 px-3">Activity Description</th>
                  <th className="pb-3 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">
                      No activity logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{log.user}</p>
                        <p className="text-[10px] font-medium text-slate-400">{log.role}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 ${
                          log.type === 'LOGIN' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          log.type === 'LOGOUT' ? 'bg-slate-100 text-slate-600' :
                          log.type === 'APPROVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-purple-50 text-purple-600 border border-purple-100'
                        }`}>
                          {log.type === 'LOGIN' && <LogIn size={10} />}
                          {log.type === 'LOGOUT' && <LogOut size={10} />}
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">{log.detail}</td>
                      <td className="py-3.5 px-3 text-right">
                        <p className="font-bold text-slate-900">{log.time}</p>
                        <p className="text-[10px] font-medium text-slate-400">{log.date}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-center border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400">
              Showing {filteredLogs.length} audit trail records
            </span>
          </div>

        </div>
      )}

    </div>
  );
}