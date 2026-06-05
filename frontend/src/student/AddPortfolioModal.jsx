import React, { useState } from 'react';
import { X, FileText, Award, CheckCircle2, UploadCloud, Plus, Trash2 } from 'lucide-react';
import api from '../api';

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
    formData.append('student_id', localStorage.getItem('studentId'));
    
    // Pass baseline values unaltered so endpoint doesn't erase them
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto transition-all">
        
        {showSuccess ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#093fb4]/10 rounded-full flex items-center justify-center text-[#093fb4] mb-5 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Documents Uploaded!</h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed mb-6">
              Your new portfolio records, credentials, or files have been saved successfully.
            </p>
            <button
              onClick={handleSuccessClose}
              className="w-full max-w-xs bg-[#093fb4] text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="h-1 bg-[#093fb4]" />

            <div className="p-7 max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">Upload Portfolio Items</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Attach certificates, achievements, or resumes</p>
                </div>
                <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#093fb4] hover:border-[#093fb4] transition-all">
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {validationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
                    {validationError}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest"> Add to your Portfolio ({files.length})</label>
                  <button
                    type="button"
                    onClick={addFileRow}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase bg-[#093fb4]/10 text-[#093fb4] px-2.5 py-1.5 rounded-lg hover:bg-[#093fb4] hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={12} /> Add file
                  </button>
                </div>

                {files.length === 0 ? (
                  <div 
                    onClick={addFileRow}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 text-center hover:border-[#093fb4]/40 cursor-pointer transition-all flex flex-col items-center justify-center"
                  >
                    <UploadCloud className="text-slate-300 mb-2" size={32} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No attachments configured</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Click here or button above to map new attachment rows</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                    {files.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => removeFileRow(idx)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="grid grid-cols-3 gap-2 pr-6">
                          <input
                            type="text"
                            placeholder="e.g., OJT Certification..."
                            className="col-span-2 p-2 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-medium text-black transition-all"
                            value={item.title}
                            onChange={e => updateFileRow(idx, 'title', e.target.value)}
                          />
                          <select
                            className="p-2 bg-white rounded-lg border border-slate-200 focus:border-[#093fb4] outline-none text-xs font-bold text-slate-700 cursor-pointer transition-all"
                            value={item.type}
                            onChange={e => updateFileRow(idx, 'type', e.target.value)}
                          >
                            <option value="Certificate">Certificate</option>
                            <option value="CV">CV / Resume</option>
                            <option value="Achievement">Achievement</option>
                          </select>
                        </div>

                        <div className="relative border border-dashed border-slate-200 bg-white rounded-lg h-10 flex items-center justify-center px-3 cursor-pointer hover:border-[#093fb4]/30">
                          {item.fileObj ? (
                            <div className="flex items-center gap-2 w-full text-xs">
                              <Award className="text-[#093fb4] shrink-0" size={14} />
                              <span className="font-bold text-black truncate flex-1">{item.fileObj.name}</span>
                              <span className="text-[9px] text-slate-400">({(item.fileObj.size / 1024).toFixed(0)} KB)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <FileText size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Choose File Attachment</span>
                            </div>
                          )}
                         <input
  type="file"
  // ✅ 1. Restricts the system file selection picker interface to specified types
  accept=".pdf,.png,.jpg,.jpeg" 
  className="absolute inset-0 opacity-0 cursor-pointer"
  onChange={e => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // ✅ 2. Instantly check the file format extension
      const allowedExtensions = /(\.pdf|\.png|\.jpg|\.jpeg)$/i;
      if (!allowedExtensions.exec(selectedFile.name)) {
        setValidationError('Invalid format selection. Only PDF, PNG, JPG, and JPEG documents are permitted!');
        e.target.value = ''; // Clean the target path reference
        return;
      }
      
      // If validation passes, update file row safely
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
                  className="w-full bg-[#093fb4] text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {uploading ? "Uploading items..." : "Upload Portfolio"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}