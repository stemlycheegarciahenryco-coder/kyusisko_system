import React from 'react';
import { XCircle } from 'lucide-react';

const backendURL = "http://localhost:5000";

export function InfoBox({ label, value }) {
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
            <p className="text-slate-800 font-bold">{value}</p>
        </div>
    );
}

export default function StudentProfileModal({ isOpen, onClose, student }) {
    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Student Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XCircle size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="h-28 w-28 bg-blue-600 rounded-3xl overflow-hidden shadow-lg shadow-blue-200 flex items-center justify-center border-4 border-white">
                            {student.sprofile_pic ? (
                                <img
                                    src={`${backendURL}/${student.sprofile_pic}`}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150" }}
                                />
                            ) : (
                                <span className="text-white text-3xl font-black">
                                    {student.sfirst_name?.[0]}{student.slast_name?.[0]}
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-slate-900">{student.sfirst_name} {student.slast_name}</h3>
                            <p className="text-slate-500 font-medium">{student.student_email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded-lg tracking-wider">
                                    {student.student_no}
                                </span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg tracking-wider">
                                    Verified
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">
                            Academic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoBox label="Course & Year" value={student.course || "Not specified"} />
                            <InfoBox label="GWA / General Average" value={student.gwa || "N/A"} />
                            <InfoBox label="Educational Institution" value={student.school_name || "Not specified"} />
                            <InfoBox label="Enrollment Status" value="Currently Enrolled" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
}