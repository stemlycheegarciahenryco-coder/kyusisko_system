import React, { useState } from 'react';
import { X, FileText, Award, CheckCircle2, UploadCloud, Plus, Trash2 } from 'lucide-react';
import api from '../api';

const inputCls = "w-full px-4 py-3.5 bg-white/60 border-2 border-white/80 rounded-2xl focus:bg-white focus:border-[#093fb4] outline-none transition-all placeholder:text-black/30 font-bold text-slate-900 text-sm shadow-sm";

export default function AddPortfolioModal({ onClose, studentData }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const addFileRow = () => {
    setValidationError('');
    setFiles(prev => [...prev, { title: '', type: 'Certificate', fileObj: null }]);
  };

  const updateFileRow = (index, field, value) => {
    setValidationError('');
    setFiles(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const removeFileRow = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const validFiles = files.filter(item => item.fileObj);

    if (files.length === 0 || validFiles.length === 0) {
      setValidationError('Please upload at least one valid document or certificate to update your portfolio.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    formData.append('bio', studentData?.bio || '');
    formData.append('college_id', studentData?.college_id || '');
    formData.append('course_id', studentData?.course_id || '');
    formData.append('other_school', studentData?.other_school || '');
    formData.append('other_degree_program', studentData?.other_degree_program || '');
    formData.append('sports_interests', Array.isArray(studentData?.sports_interests) ? studentData.sports_interests.join(', ') : studentData?.sports_interests || '');

    validFiles.forEach((item) => {
      formData.append('titles', item.title || 'Untitled Document');
      formData.append('types', item.type);
      formData.append('files', item.fileObj);
    });

    try {
      await api.patch('/students/update-portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload portfolio document.");
    } finally {
      setUploading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    window.location.reload(); 
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto font-['Inter']">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto border border-white/60 transition-all">
        
        {showSuccess ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-[#093fb4] mb-6 shadow-inner animate-bounce border border-blue-100">
              <CheckCircle2 size={40} stroke={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Documents Uploaded!</h3>
            <p className="text-sm text-slate-600 font-semibold max-w-sm leading-relaxed mb-8">
              Your new portfolio records and credentials have been securely saved.
            </p>
            <button
              onClick={handleSuccessClose}
              className="w-full max-w-sm bg-[#093fb4] hover:bg-[#073496] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-8 md:p-10 max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Upload Portfolio</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Attach achievements or resumes</p>
                </div>
                <button type="button" onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/60 border-2 border-white/80 flex items-center justify-center text-slate-500 hover:text-[#FF1E1E] transition-all shadow-sm">
                  <X size={20} stroke={2.5} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-black uppercase text-red-600 tracking-wider">
                    {validationError}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black uppercase text-[#093fb4] tracking-wider ml-1"> 
                    Attachments ({files.length})
                  </label>
                  <button
                    type="button"
                    onClick={addFileRow}
                    className="flex items-center gap-2 text-xs font-black uppercase bg-[#093fb4]/10 text-[#093fb4] px-4 py-2.5 rounded-xl hover:bg-[#093fb4] hover:text-white transition-all tracking-wider"
                  >
                    <Plus size={16} stroke={2.5} /> Add file
                  </button>
                </div>

                {files.length === 0 ? (
                  <div 
                    onClick={addFileRow}
                    className="border-2 border-dashed border-slate-300 rounded-[2rem] p-10 bg-white/50 text-center hover:border-[#093fb4]/60 hover:bg-blue-50/50 cursor-pointer transition-all flex flex-col items-center justify-center"
                  >
                    <UploadCloud className="text-slate-400 mb-3" size={44} stroke={1.5} />
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">No attachments configured</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Click here to map new attachment rows</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                    {files.map((item, idx) => (
                      <div key={idx} className="p-5 bg-white/60 border-2 border-white/80 shadow-sm rounded-2xl space-y-4 relative">
                        <button
                          type="button"
                          onClick={() => removeFileRow(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-[#FF1E1E] transition-colors"
                        >
                          <Trash2 size={20} stroke={2.5} />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pr-10">
                          <input
                            type="text"
                            placeholder="e.g. OJT Certification..."
                            className={`${inputCls} sm:col-span-2`}
                            value={item.title}
                            onChange={e => updateFileRow(idx, 'title', e.target.value)}
                          />
                          <select
                            className={inputCls}
                            value={item.type}
                            onChange={e => updateFileRow(idx, 'type', e.target.value)}
                          >
                            <option value="Certificate">Certificate</option>
                            <option value="CV">CV / Resume</option>
                            <option value="Achievement">Achievement</option>
                          </select>
                        </div>

                        <div className="relative border-2 border-dashed border-slate-300 bg-white/40 rounded-2xl h-16 flex items-center justify-center px-4 cursor-pointer hover:border-[#093fb4]/50 transition-all">
                          {item.fileObj ? (
                            <div className="flex items-center gap-3 w-full text-sm">
                              <Award className="text-[#093fb4] shrink-0" size={22} stroke={2.5} />
                              <span className="font-black text-slate-900 truncate flex-1 tracking-wide">{item.fileObj.name}</span>
                              <span className="text-xs font-bold text-slate-500">{(item.fileObj.size / 1024).toFixed(0)} KB</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                              <FileText size={20} stroke={2.5} />
                              <span className="text-xs font-black uppercase tracking-wider">Choose File Attachment</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => {
                              const selectedFile = e.target.files?.[0];
                              if (selectedFile) {
                                const allowedExtensions = /(\.pdf|\.png|\.jpg|\.jpeg)$/i;
                                if (!allowedExtensions.exec(selectedFile.name)) {
                                  setValidationError('Invalid format selection. Only PDF, PNG, JPG, and JPEG documents are permitted!');
                                  e.target.value = ''; 
                                  return;
                                }
                                updateFileRow(idx, 'fileObj', selectedFile);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-[#093fb4]/70 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-2 mt-4"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : "Upload Portfolio"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}