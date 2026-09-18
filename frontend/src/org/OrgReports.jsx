import React, { useState, useEffect } from 'react';
import api from '../api';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from "docx";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Download, PieChart, ClipboardList, Trophy } from 'lucide-react';

import OverallReportPanel from './OverallReportPanel';
import ApplicationsReportPanel from './ApplicationsReportPanel';
import SuccessfulProgramsReportPanel from './SuccessfulProgramsReportPanel';

const getDisplayStatus = (rawStatus) => {
    const s = rawStatus?.toLowerCase();
    if (s === 'draft') return 'draft';
    if (s === 'archived') return 'archived';
    if (s === 'closed' || s === 'deadline_passed') return 'closed';
    return 'active';
};

const STATUS_LABELS = { active: 'Active', closed: 'Closed', draft: 'Draft', archived: 'Archived' };

const DEMOGRAPHIC_TABS = [
    { key: 'byProgram', label: 'By Program' },
    { key: 'byCourse', label: 'By Course' },
    { key: 'byDistrict', label: 'By District' },
    { key: 'byBarangay', label: 'By Barangay' },
];

const REPORT_TABS = [
    { key: 'overall', label: 'Overall', icon: PieChart },
    { key: 'applications', label: 'Applications', icon: ClipboardList },
    { key: 'successful', label: 'Successful Scholarships', icon: Trophy },
];

export default function OrgReports() {
    const [reportTab, setReportTab] = useState('overall');

    // Data used by the Overall tab AND by the docx/pdf export (export always
    // includes the financial + demographics snapshot, regardless of which
    // tab is currently open).
    const [fundData, setFundData] = useState([]);
    const [demographics, setDemographics] = useState({
        byProgram: [], byCourse: [], byDistrict: [], byBarangay: []
    });
    const [demoTab, setDemoTab] = useState('byProgram');

    const [financialInterpretation, setFinancialInterpretation] = useState('');
    const [demographicInterpretation, setDemographicInterpretation] = useState('');

    const [totals, setTotals] = useState({
        totalAllocatedFund: 0,
        totalDisbursed: 0,
        disbursedFromDeletedPrograms: 0,
        totalRemaining: 0,
        totalApprovedStudents: 0,
        programsMissingAmount: 0,
        draftProgramCount: 0,
        totalMale: 0,
        totalFemale: 0,
        totalUnspecified: 0,
    });
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reportsError, setReportsError] = useState(null);

    useEffect(() => {
        const fetchAnalyticsReports = async () => {
            try {
                setReportsLoading(true);
                setReportsError(null);

                const [finRes, demoRes] = await Promise.allSettled([
                    api.get('/reports/financial'),
                    api.get('/reports/demographics')
                ]);

                if (finRes.status === 'fulfilled' && finRes.value.data?.success) {
                    const finData = finRes.value.data.data;
                    setFundData(finData.programs || []);
                    setFinancialInterpretation(finData.interpretation || '');
                    setTotals(prev => ({
                        ...prev,
                        totalAllocatedFund: finData.totalBudget || 0,
                        totalDisbursed: finData.totalDisbursed || 0,
                        disbursedFromDeletedPrograms: finData.disbursedFromDeletedPrograms || 0,
                        totalRemaining: finData.totalRemaining || 0,
                        programsMissingAmount: finData.missingBudgetCount || 0,
                        draftProgramCount: finData.draftProgramCount || 0,
                    }));
                }

                if (demoRes.status === 'fulfilled' && demoRes.value.data?.success) {
                    const demoData = demoRes.value.data.data;
                    setDemographics({
                        byProgram: demoData.byProgram || [],
                        byCourse: demoData.byCourse || [],
                        byDistrict: demoData.byDistrict || [],
                        byBarangay: demoData.byBarangay || [],
                    });
                    setDemographicInterpretation(demoData.interpretation || '');
                    setTotals(prev => ({
                        ...prev,
                        totalApprovedStudents: demoData.totalScholars || 0,
                        totalMale: demoData.totalMale || 0,
                        totalFemale: demoData.totalFemale || 0,
                        totalUnspecified: demoData.totalUnspecified || 0,
                    }));
                }
            } catch (err) {
                console.error("Reports Fetch Error:", err);
                setReportsError("Couldn't load report analytics. Please verify report API routes.");
            } finally {
                setReportsLoading(false);
            }
        };

        fetchAnalyticsReports();
    }, []);

    // ── Document export (Docx / PDF) — covers the Overall tab's data only. ──
    // NOTE: Applications-overview and Successful-programs data aren't part
    // of this export yet since they live in their own self-fetching panels.
    // Say the word if you want those folded into the exported doc too.
    const createDocumentReport = () => {
        const baseDate = new Date();
        const generatedAt = baseDate.toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });
        const fileTimestamp = generatedAt.replace(/[\/,\s:]/g, '_').replace(/_{2,}/g, '_');

        const fundrows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(new TextRun({ text: "Program", bold: true }))] }),
                    new TableCell({ children: [new Paragraph(new TextRun({ text: "Budget", bold: true }))] }),
                    new TableCell({ children: [new Paragraph(new TextRun({ text: "Disbursed", bold: true }))] }),
                    new TableCell({ children: [new Paragraph(new TextRun({ text: "Remaining", bold: true }))] }),
                    new TableCell({ children: [new Paragraph(new TextRun({ text: "Status", bold: true }))] }),
                ]
            }),
            ...(fundData || []).map(p => {
                const status = getDisplayStatus(p.status);
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(p.title || p.program)] }),
                        new TableCell({ children: [new Paragraph(p.is_draft ? 'Not counted (draft)' : (p.total_budget != null ? `₱${p.total_budget.toLocaleString()}` : 'Not set'))] }),
                        new TableCell({ children: [new Paragraph(p.is_draft ? '—' : `₱${(p.disbursed || 0).toLocaleString()}`)] }),
                        new TableCell({ children: [new Paragraph(p.is_draft ? '—' : (p.remaining_budget != null ? `₱${p.remaining_budget.toLocaleString()}` : '—'))] }),
                        new TableCell({ children: [new Paragraph(STATUS_LABELS[status] || status)] }),
                    ]
                });
            })
        ];

        const children = [
            new Paragraph({ children: [new TextRun({ text: "SCHOLARSHIP PROGRAM REPORT", bold: true, size: 32 })] }),
            new Paragraph({ children: [new TextRun(`Generated: ${generatedAt}`)] }),
            new Paragraph({}),

            new Paragraph({ children: [new TextRun({ text: "FINANCIAL & FUND ALLOCATION", bold: true, size: 24 })] }),
            new Paragraph({ children: [new TextRun(`Total Program Budget: ₱${totals.totalAllocatedFund.toLocaleString()}`)] }),
            new Paragraph({ children: [new TextRun(`Total Disbursed: ₱${totals.totalDisbursed.toLocaleString()}`)] }),
            ...(totals.disbursedFromDeletedPrograms > 0
                ? [new Paragraph({ children: [new TextRun(`  (includes ₱${totals.disbursedFromDeletedPrograms.toLocaleString()} disbursed under programs since permanently deleted)`)] })]
                : []),
            new Paragraph({ children: [new TextRun(`Total Remaining: ₱${totals.totalRemaining.toLocaleString()}`)] }),
            new Paragraph({ children: [new TextRun(`Programs With No Budget Set: ${totals.programsMissingAmount}`)] }),
            new Paragraph({ children: [new TextRun(`Draft Programs (excluded from totals): ${totals.draftProgramCount}`)] }),
            new Paragraph({}),

            new Paragraph({ children: [new TextRun({ text: "Per-Program Breakdown:", bold: true })] }),
            new Table({ rows: fundrows }),
            new Paragraph({}),

            new Paragraph({ children: [new TextRun({ text: "Interpretation:", bold: true })] }),
            new Paragraph({ children: [new TextRun(financialInterpretation || "")] }),
            new Paragraph({}),

            new Paragraph({ children: [new TextRun({ text: "APPLICANT DEMOGRAPHICS", bold: true, size: 24 })] }),
            new Paragraph({
                children: [new TextRun(
                    `Total Approved Scholars: ${totals.totalApprovedStudents} (${totals.totalMale} Male, ${totals.totalFemale} Female${totals.totalUnspecified > 0 ? `, ${totals.totalUnspecified} Unspecified` : ''})`
                )],
            }),
            new Paragraph({}),
        ];

        DEMOGRAPHIC_TABS.forEach(({ key, label }) => {
            const rows = demographics[key] || [];
            children.push(new Paragraph({ children: [new TextRun({ text: `${label}:`, bold: true })] }));
            if (rows.length === 0) {
                children.push(new Paragraph({ children: [new TextRun("(no records)")] }));
            } else {
                rows.forEach((row) => {
                    children.push(new Paragraph({
                        children: [new TextRun(`  • ${row.name}: ${row.total} total (Male ${row.male}, Female ${row.female}${row.unspecified ? `, Unspecified ${row.unspecified}` : ''})`)],
                    }));
                });
            }
            children.push(new Paragraph({}));
        });

        children.push(new Paragraph({ children: [new TextRun({ text: "Interpretation:", bold: true })] }));
        children.push(new Paragraph({ children: [new TextRun(demographicInterpretation || "")] }));

        return {
            doc: new Document({ sections: [{ children }] }),
            filename: `scholarship-report-${fileTimestamp}.docx`
        };
    };

    const createPdfReport = () => {
        const baseDate = new Date();
        const generatedAt = baseDate.toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });
        const fileTimestamp = generatedAt.replace(/[\/,\s:]/g, '_').replace(/_{2,}/g, '_');

        const fundTableBody = [
            [
                { text: 'Program', bold: true },
                { text: 'Budget', bold: true },
                { text: 'Disbursed', bold: true },
                { text: 'Remaining', bold: true },
                { text: 'Status', bold: true }
            ],
            ...(fundData || []).map(p => {
                const status = getDisplayStatus(p.status);
                return [
                    p.title || p.program,
                    p.is_draft ? 'Not counted (draft)' : (p.total_budget != null ? `₱${p.total_budget.toLocaleString()}` : 'Not set'),
                    p.is_draft ? '—' : `₱${(p.disbursed || 0).toLocaleString()}`,
                    p.is_draft ? '—' : (p.remaining_budget != null ? `₱${p.remaining_budget.toLocaleString()}` : '—'),
                    STATUS_LABELS[status] || status
                ];
            })
        ];

        const demographicContent = [];
        DEMOGRAPHIC_TABS.forEach(({ key, label }) => {
            const rows = demographics[key] || [];
            demographicContent.push({ text: `${label}:`, bold: true, margin: [0, 5, 0, 2] });
            if (rows.length === 0) {
                demographicContent.push({ text: '(no records)', italics: true, margin: [10, 0, 0, 5] });
            } else {
                rows.forEach((row) => {
                    demographicContent.push({
                        text: `• ${row.name}: ${row.total} total (Male ${row.male}, Female ${row.female}${row.unspecified ? `, Unspecified ${row.unspecified}` : ''})`,
                        margin: [10, 0, 0, 2]
                    });
                });
            }
        });

        const docDefinition = {
            content: [
                { text: 'SCHOLARSHIP PROGRAM REPORT', fontSize: 16, bold: true, margin: [0, 0, 0, 5] },
                { text: `Generated: ${generatedAt}`, fontSize: 10, color: '#666666', margin: [0, 0, 0, 15] },

                { text: 'FINANCIAL & FUND ALLOCATION', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
                { text: `Total Program Budget: ₱${totals.totalAllocatedFund.toLocaleString()}` },
                { text: `Total Disbursed: ₱${totals.totalDisbursed.toLocaleString()}` },
                ...(totals.disbursedFromDeletedPrograms > 0
                    ? [{ text: `  (includes ₱${totals.disbursedFromDeletedPrograms.toLocaleString()} disbursed under programs since permanently deleted)`, fontSize: 9, italics: true, color: '#666666' }]
                    : []),
                { text: `Total Remaining: ₱${totals.totalRemaining.toLocaleString()}` },
                { text: `Programs With No Budget Set: ${totals.programsMissingAmount}` },
                { text: `Draft Programs (excluded from totals): ${totals.draftProgramCount}`, margin: [0, 0, 0, 10] },

                { text: 'Per-Program Breakdown:', bold: true, margin: [0, 0, 0, 5] },
                { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto'], body: fundTableBody }, margin: [0, 0, 0, 10] },

                { text: 'Interpretation:', bold: true, margin: [0, 0, 0, 2] },
                { text: financialInterpretation || '', margin: [0, 0, 0, 15] },

                { text: 'APPLICANT DEMOGRAPHICS', fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
                {
                    text: `Total Approved Scholars: ${totals.totalApprovedStudents} (${totals.totalMale} Male, ${totals.totalFemale} Female${totals.totalUnspecified > 0 ? `, ${totals.totalUnspecified} Unspecified` : ''})`,
                    margin: [0, 0, 0, 10]
                },

                ...demographicContent,

                { text: 'Interpretation:', bold: true, margin: [0, 10, 0, 2] },
                { text: demographicInterpretation || '' }
            ],
            defaultStyle: { fontSize: 10, color: '#333333' }
        };

        return { docDefinition, filename: `scholarship-report-${fileTimestamp}.pdf` };
    };

    const handlePdfReport = () => {
        const { docDefinition, filename } = createPdfReport();
        pdfMake.createPdf(docDefinition).download(filename);
    };

    const handleDocxReport = () => {
        const { doc, filename } = createDocumentReport();
        Packer.toBlob(doc).then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="p-8 bg-slate-50/50 min-h-screen font-sans space-y-6">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
                    <p className="text-slate-500 text-sm font-medium mt-0.5">
                        Overall performance, application pipeline, and completed scholarships.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleDocxReport}
                        disabled={reportsLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                        <Download size={14} /> Docx
                    </button>
                    <button
                        onClick={handlePdfReport}
                        disabled={reportsLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                        <Download size={14} /> Pdf
                    </button>
                </div>
            </div>

            {/* Report Tab Selector — 3 divisions */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs w-fit">
                {REPORT_TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setReportTab(key)}
                        className={`flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all ${reportTab === key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {reportTab === 'overall' && (
                <OverallReportPanel
                    reportsLoading={reportsLoading}
                    reportsError={reportsError}
                    fundData={fundData}
                    totals={totals}
                    financialInterpretation={financialInterpretation}
                    demographics={demographics}
                    demographicInterpretation={demographicInterpretation}
                    demoTab={demoTab}
                    setDemoTab={setDemoTab}
                />
            )}

            {reportTab === 'applications' && <ApplicationsReportPanel />}

            {reportTab === 'successful' && <SuccessfulProgramsReportPanel />}

        </div>
    );
}