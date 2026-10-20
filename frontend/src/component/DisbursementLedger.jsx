import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Banknote, Download, Search } from 'lucide-react';

// GET /applications/scholarship/:id/disbursements  → scoped to one program
// GET /applications/disbursements                  → org-wide, all programs
// Route this at e.g. /scholarship-applications/:id/disbursements for the
// scoped view, or mount without :id for the org-wide view.
export default function DisbursementLedger() {
    const { id } = useParams(); // undefined => org-wide ledger
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [scholarship, setScholarship] = useState(null);
    const [entries, setEntries] = useState([]);
    const [totalGiven, setTotalGiven] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const url = id
                    ? `/applications/scholarship/${id}/disbursements`
                    : `/applications/disbursements`;
                const res = await api.get(url);
                const data = res.data.data || res.data;
                setScholarship(data.scholarship || null);
                setEntries(data.entries || []);
                setTotalGiven(data.total_given || 0);
            } catch (err) {
                console.error('Failed to fetch disbursement ledger', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, [id]);

    const filteredEntries = entries.filter((e) => {
        const fullName = `${e.sfirst_name || ''} ${e.slast_name || ''}`.toLowerCase();
        const program = (e.program_name || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return fullName.includes(q) || program.includes(q);
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#093fb4] border-t-transparent rounded-full animate-spin" />
                <p className="text-[12px] font-black uppercase tracking-widest text-black">Loading Ledger...</p>
            </div>
        </div>
    );

    // Builds an .xlsx file in the browser and downloads it. Exports what is currently
    // shown in the table (so the search filter is respected).
    const handleExcel = async () => {
        if (exporting || filteredEntries.length === 0) return;
        setExporting(true);
        setExportError('');
        try {
            // Loaded only when needed so it doesn't slow down the initial page load
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'KyusISKO';
            workbook.created = new Date();
            const sheet = workbook.addWorksheet('Disbursement Ledger');

            sheet.columns = [
                { key: 'date', width: 16 },
                { key: 'amount', width: 18 },
                { key: 'student', width: 28 },
                { key: 'program', width: 34 },
                { key: 'remarks', width: 40 },
            ];

            const BRAND = 'FF093FB4';
            const thin = { style: 'thin', color: { argb: 'FFCBD5E1' } };
            const border = { top: thin, left: thin, bottom: thin, right: thin };
            const peso = '"₱"#,##0.00';

            // Title block
            sheet.mergeCells('A1:E1');
            sheet.getCell('A1').value = 'DISBURSEMENT LEDGER';
            sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: BRAND } };

            sheet.mergeCells('A2:E2');
            sheet.getCell('A2').value =
                `${scholarship ? scholarship.title : 'All Programs'} · ${filteredEntries.length} release${filteredEntries.length === 1 ? '' : 's'}`;
            sheet.getCell('A2').font = { bold: true, size: 11 };

            sheet.mergeCells('A3:E3');
            sheet.getCell('A3').value = `Generated: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
            sheet.getCell('A3').font = { size: 10, color: { argb: 'FF64748B' } };

            // Budget summary
            let r = 5;
            const addSummary = (label, value) => {
                sheet.getCell(`A${r}`).value = label;
                sheet.getCell(`A${r}`).font = { bold: true };
                sheet.getCell(`B${r}`).value = Number(value);
                sheet.getCell(`B${r}`).numFmt = peso;
                sheet.getCell(`B${r}`).font = { bold: true };
                r += 1;
            };
            addSummary('Total Given', totalGiven);
            if (scholarship?.total_budget != null) addSummary('Total Budget', scholarship.total_budget);
            if (scholarship?.remaining_budget != null) addSummary('Remaining Budget', scholarship.remaining_budget);

            // Table header
            const headerRowNumber = r + 1;
            const header = sheet.getRow(headerRowNumber);
            header.values = ['Date', 'Amount', 'Student (Recipient)', 'Program', 'Remarks'];
            header.height = 22;
            header.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.border = border;
            });

            // Data rows
            let sum = 0;
            filteredEntries.forEach((entry) => {
                const amount = Number(entry.amount) || 0;
                sum += amount;
                const row = sheet.addRow([
                    entry.disbursed_at ? new Date(entry.disbursed_at) : '',
                    amount,
                    `${entry.sfirst_name || ''} ${entry.slast_name || ''}`.trim(),
                    entry.program_name || '',
                    entry.remarks || '',
                ]);
                row.getCell(1).numFmt = 'mmm d, yyyy';
                row.getCell(1).alignment = { horizontal: 'left' };
                row.getCell(2).numFmt = peso;
                row.eachCell({ includeEmpty: true }, (cell) => { cell.border = border; });
            });

            // Total row
            const firstData = headerRowNumber + 1;
            const lastData = headerRowNumber + filteredEntries.length;
            const totalRow = sheet.addRow(['TOTAL', { formula: `SUM(B${firstData}:B${lastData})`, result: sum }, '', '', '']);
            totalRow.getCell(2).numFmt = peso;
            totalRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = border;
            });

            sheet.autoFilter = {
                from: { row: headerRowNumber, column: 1 },
                to: { row: lastData, column: 5 },
            };

            // Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const safeName = (scholarship ? scholarship.title : 'All_Programs')
                .replace(/[^a-z0-9]+/gi, '_')
                .replace(/^_+|_+$/g, '');
            const stamp = new Date().toISOString().slice(0, 10);

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Disbursement_Ledger_${safeName}_${stamp}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Excel export failed', err);
            setExportError('Could not generate the Excel file. Please try again.');
            setTimeout(() => setExportError(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-black hover:text-[#093fb4] transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                    {exportError && (
                        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[12px] font-bold text-rose-600 shadow-md">
                            {exportError}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleExcel}
                        disabled={exporting || filteredEntries.length === 0}
                        title={filteredEntries.length === 0 ? 'No entries to export' : 'Download as Excel'}
                        className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-teal-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <Download size={16} /> {exporting ? 'Exporting...' : 'Excel'}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                            Disbursement <span className="text-[#093fb4]">Ledger</span>
                        </h1>
                        <p className="text-[12px] font-bold text-black mt-1 uppercase tracking-widest">
                            {scholarship ? scholarship.title : 'All Programs'} · {entries.length} release{entries.length === 1 ? '' : 's'}
                        </p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by student or program..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-[13px] font-medium text-black focus:border-[#093fb4] focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Budget summary strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <SummaryCard label="Total Given" value={`₱${Number(totalGiven).toLocaleString()}`} />
                    {scholarship?.total_budget != null && (
                        <SummaryCard label="Total Budget" value={`₱${Number(scholarship.total_budget).toLocaleString()}`} />
                    )}
                    {scholarship?.remaining_budget != null && (
                        <SummaryCard label="Remaining Budget" value={`₱${Number(scholarship.remaining_budget).toLocaleString()}`} accent />
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-300 bg-white text-[11px] font-black uppercase tracking-widest text-slate-600">
                                    <th className="py-4 px-6">Date</th>
                                    <th className="py-4 px-6">Amount</th>
                                    <th className="py-4 px-6">Student (Recipient)</th>
                                    <th className="py-4 px-6">Program</th>
                                    <th className="py-4 px-6">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                                            No disbursements recorded yet
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="text-black">
                                            <td className="py-4 px-6 text-[13px] font-medium text-slate-700">
                                                {new Date(entry.disbursed_at).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 text-[13px] font-black text-emerald-700">
                                                    <Banknote size={12} />
                                                    ₱{Number(entry.amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[13px] font-bold text-black uppercase tracking-tight">
                                                {entry.sfirst_name} {entry.slast_name}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] font-medium text-slate-700">
                                                {entry.program_name}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] font-medium text-slate-500">
                                                {entry.remarks || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, accent }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`text-lg font-black mt-1 ${accent ? 'text-[#093fb4]' : 'text-black'}`}>{value}</p>
        </div>
    );
}