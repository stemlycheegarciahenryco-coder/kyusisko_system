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
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto transition-all">
        
        {showSuccess ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-[#093fb4] mb-6 animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-3">Documents Uploaded!</h3>
            <p className="text-base text-slate-600 font-medium max-w-sm leading-relaxed mb-8">
              Your new portfolio records, credentials, or files have been saved successfully.
            </p>
            <button
              onClick={handleSuccessClose}
              className="w-full max-w-sm bg-[#093fb4] text-white py-4 rounded-xl font-bold text-base uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="h-1.5 bg-[#093fb4]" />

            <div className="p-8 max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold text-black uppercase tracking-tight">Upload Portfolio Items</h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Attach certificates, achievements, or resumes</p>
                </div>
                <button type="button" onClick={onClose} className="w-10 h-10 rounded-xl border border-slate-300 flex items-center justify-center text-slate-500 hover:text-[#093fb4] hover:border-[#093fb4] transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
                    {validationError}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold uppercase text-[#093fb4] tracking-widest"> Add to your Portfolio ({files.length})</label>
                  <button
                    type="button"
                    onClick={addFileRow}
                    className="flex items-center gap-2 text-sm font-bold uppercase bg-blue-50 text-[#093fb4] px-4 py-2 rounded-lg hover:bg-[#093fb4] hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} /> Add file
                  </button>
                </div>

                {files.length === 0 ? (
                  <div 
                    onClick={addFileRow}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-10 bg-white text-center hover:border-[#093fb4]/60 cursor-pointer transition-all flex flex-col items-center justify-center"
                  >
                    <UploadCloud className="text-slate-400 mb-3" size={40} />
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">No attachments configured</p>
                    <p className="text-sm text-slate-500 mt-1">Click here or button above to map new attachment rows</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                    {files.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-300 shadow-sm rounded-xl space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => removeFileRow(idx)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-3 gap-3 pr-8">
                          <input
                            type="text"
                            placeholder="e.g., OJT Certification..."
                            className="col-span-2 p-3 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-medium text-black transition-all"
                            value={item.title}
                            onChange={e => updateFileRow(idx, 'title', e.target.value)}
                          />
                          <select
                            className="p-3 bg-white rounded-xl border border-slate-300 focus:border-[#093fb4] outline-none text-base font-bold text-slate-800 cursor-pointer transition-all"
                            value={item.type}
                            onChange={e => updateFileRow(idx, 'type', e.target.value)}
                          >
                            <option value="Certificate">Certificate</option>
                            <option value="CV">CV / Resume</option>
                            <option value="Achievement">Achievement</option>
                          </select>
                        </div>

                        <div className="relative border border-dashed border-slate-300 bg-slate-50 rounded-xl h-14 flex items-center justify-center px-4 cursor-pointer hover:border-[#093fb4]/50 hover:bg-blue-50/30 transition-all">
                          {item.fileObj ? (
                            <div className="flex items-center gap-3 w-full text-base">
                              <Award className="text-[#093fb4] shrink-0" size={20} />
                              <span className="font-bold text-black truncate flex-1">{item.fileObj.name}</span>
                              <span className="text-xs text-slate-500">({(item.fileObj.size / 1024).toFixed(0)} KB)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                              <FileText size={18} />
                              <span className="text-sm font-bold uppercase tracking-wider">Choose File Attachment</span>
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
                  className="w-full bg-[#093fb4] text-white py-4 rounded-xl font-bold text-base uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading items...
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