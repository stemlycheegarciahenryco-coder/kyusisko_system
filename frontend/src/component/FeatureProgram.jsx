import React, { useState } from 'react';
import api from '../api';
import { 
    Award, EyeOff, ChevronDown, ChevronUp, CheckCircle, Clock, 
    X, BookOpen, Check 
} from 'lucide-react';

const STATUS_META = {
    Active:   { color: 'text-emerald-700 border-emerald-200 bg-emerald-50', dotColor: 'bg-emerald-500' },
    Open:     { color: 'text-emerald-700 border-emerald-200 bg-emerald-50', dotColor: 'bg-emerald-500' },
    Closed:   { color: 'text-rose-700 border-rose-200 bg-rose-50', dotColor: 'bg-rose-500' },
    Upcoming: { color: 'text-amber-700 border-amber-200 bg-amber-50', dotColor: 'bg-amber-500' },
};

const FeatureProgram = ({ programs, setPrograms, availableOptions, loadWorkspaceData }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProgramIds, setSelectedProgramIds] = useState([]);
    const [expandedProg, setExpandedProg] = useState(null);

    const toggleProgramSelection = (id) => {
        setSelectedProgramIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        const selectableOptions = availableOptions
            .filter(opt => !programs.some(p => String(p.id) === String(opt.id)))
            .map(opt => opt.id);
        setSelectedProgramIds(selectedProgramIds.length === selectableOptions.length ? [] : selectableOptions);
    };

    const handleAddSelectedPrograms = async () => {
        if (selectedProgramIds.length === 0) return;
        try {
            await Promise.all(selectedProgramIds.map(id => api.patch(`/organizations/programs/${id}/visibility`, { show_on_profile: true })));
            await loadWorkspaceData();
            setIsAddModalOpen(false);
            setSelectedProgramIds([]);
        } catch (err) {
            alert("Could not update program visibility.");
        }
    };

    const hideProgramFromProfile = async (id) => { 
        if (confirm('Hide this program from profile display? (It will remain safe and active in your system database)')) {
            try {
                await api.patch(`/organizations/programs/${id}/visibility`, { show_on_profile: false });
                setPrograms(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                alert("Failed to hide program. Please try again.");
            }
        }
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <Award className="text-[#093fb4]" size={20} />
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Your Scholarship Programs</h2>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                    Feature Programs
                </button>
            </div>

            {/* Programs List */}
            <div className="space-y-4">
                {programs.map(prog => {
                    const sm = STATUS_META[prog.status] || STATUS_META.Active;
                    const expanded = expandedProg === prog.id;

                    return (
                        <div key={prog.id} className="border border-slate-100 rounded-2xl bg-white hover:border-slate-300 transition-all p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${sm.dotColor} shrink-0`} />
                                        <h3 className="font-black text-slate-900 text-sm tracking-tight truncate">{prog.title || prog.name}</h3>
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${sm.color}`}>
                                            {prog.status || 'OPEN'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                        onClick={() => hideProgramFromProfile(prog.id)} 
                                        title="Hide from profile display" 
                                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                    >
                                        <EyeOff size={15} />
                                    </button>
                                    <button
                                        onClick={() => setExpandedProg(expanded ? null : prog.id)}
                                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                                    >
                                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Program Metrics Row */}
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400">Active Scholars</p>
                                    <p className="font-black text-slate-900 mt-0.5">{prog.active_scholars ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400">Max Slots</p>
                                    <p className="font-black text-slate-900 mt-0.5">{prog.slots ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400">Application Deadline</p>
                                    <p className="font-black text-slate-900 mt-0.5 truncate">{prog.deadline || 'TBD'}</p>
                                </div>
                            </div>

                            {expanded && (
                                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium leading-relaxed">
                                    {prog.description || 'No description set for this program.'}
                                </div>
                            )}
                        </div>
                    );
                })}

                {programs.length === 0 && (
                    <div className="text-center py-12 px-6 text-slate-400 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl">
                        <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">No profile programs displayed</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">Click "Feature Programs" above to select existing programs.</p>
                    </div>
                )}
            </div>

            {/* ── FEATURE PROGRAMS MODAL ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Feature Programs</h2>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Select programs to make visible on your public profile.</p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setSelectedProgramIds([]); }} className="w-8 h-8 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-center hover:bg-slate-100 transition-all">
                                <X size={14} className="text-slate-600" strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="px-6 py-3 bg-white border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            <span>Selected: <span className="text-[#093fb4]">{selectedProgramIds.length}</span></span>
                            <button type="button" onClick={handleSelectAll} className="text-[#093fb4] hover:text-blue-800 cursor-pointer transition-colors">
                                {selectedProgramIds.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 bg-slate-50/30 scrollbar-thin">
                            {availableOptions.map(option => {
                                const isAlreadyAdded = programs.some(p => String(p.id) === String(option.id));
                                const isSelected = selectedProgramIds.includes(option.id);

                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => !isAlreadyAdded && toggleProgramSelection(option.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                                            isAlreadyAdded 
                                                ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed' 
                                                : isSelected 
                                                    ? 'border-[#093fb4] bg-blue-50/30 shadow-sm' 
                                                    : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'
                                        }`}
                                    >
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2.5">
                                                <p className="text-sm font-black text-slate-900 truncate">{option.title || option.name}</p>
                                                {isAlreadyAdded && (
                                                    <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">Featured</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{option.description || 'No description available'}</p>
                                        </div>

                                        <div className="shrink-0 pt-1">
                                            <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-[#093fb4] border-[#093fb4] text-white' : 'border-slate-200 bg-white'
                                            }`}>
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => { setIsAddModalOpen(false); setSelectedProgramIds([]); }} 
                                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-all uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAddSelectedPrograms} 
                                disabled={selectedProgramIds.length === 0}
                                className={`px-6 py-2.5 rounded-xl border-none font-bold text-xs transition-all uppercase tracking-wider flex items-center gap-2 ${
                                    selectedProgramIds.length > 0 
                                    ? 'bg-[#093fb4] text-white hover:bg-blue-800 shadow-lg cursor-pointer' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Feature ({selectedProgramIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeatureProgram;