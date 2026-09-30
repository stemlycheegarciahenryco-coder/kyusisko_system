import React, { useState, useEffect } from 'react';
import {
  X, FileText, Award, UploadCloud, Plus, Trash2, AlertTriangle, CheckCircle2, ExternalLink,
} from 'lucide-react';
import api from '../api';

const MAX_FILE_SIZE_MB = 5; // Must match the Supabase bucket + multer limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const inputCls = "w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#093fb4] outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 text-sm shadow-sm";

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;

// portfolio_data can arrive as an array, a JSON string, or null
const normalizePortfolio = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const Spinner = ({ className = 'w-4 h-4' }) => (
  <div className={`${className} border-2 border-current border-t-transparent rounded-full animate-spin`} />
);

/**
 * Props:
 *  - onClose():            close the modal
 *  - studentData:          profile object (should include portfolio_data)
 *  - onSaved(portfolio):   optional. Called after an upload/remove with the fresh
 *                          portfolio array so the parent page can update in place
 *                          (no page reload needed).
 */
export default function AddPortfolioModal({ onClose, studentData, onSaved }) {
  const [existing, setExisting] = useState(() => normalizePortfolio(studentData?.portfolio_data));
  const [loadingExisting, setLoadingExisting] = useState(studentData?.portfolio_data === undefined);
  const [confirmPath, setConfirmPath] = useState(null);   // item awaiting "are you sure?"
  const [removingPath, setRemovingPath] = useState(null); // item currently being deleted

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If the parent didn't pass portfolio_data, fetch it so previous uploads still show
  useEffect(() => {
    if (studentData?.portfolio_data !== undefined) return;
    let cancelled = false;
    api.get('/students/profile-full/me')
      .then(res => { if (!cancelled) setExisting(normalizePortfolio(res.data?.portfolio_data)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingExisting(false); });
    return () => { cancelled = true; };
  }, [studentData?.portfolio_data]);

  // Auto-hide the success banner
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ---------- existing (already uploaded) documents ----------
  const handleRemoveExisting = async (item) => {
    setConfirmPath(null);
    setRemovingPath(item.file_path);
    setValidationError('');
    try {
      const res = await api.delete('/students/portfolio-item', { params: { file_path: item.file_path } });
      const updated = Array.isArray(res.data?.portfolio_data)
        ? res.data.portfolio_data
        : existing.filter(x => x.file_path !== item.file_path);
      setExisting(updated);
      onSaved?.(updated);
      setSuccessMsg('Document removed.');
    } catch (err) {
      console.error('Remove error:', err);
      setValidationError(err.response?.data?.error || 'Failed to remove the document.');
    } finally {
      setRemovingPath(null);
    }
  };

  // ---------- new file rows ----------
  const addFileRow = () => {
    setValidationError('');
    setFiles(prev => [...prev, { title: '', type: 'Certificate', fileObj: null, error: '' }]);
  };

  const updateFileRow = (index, changes) => {
    setValidationError('');
    setFiles(prev => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  };

  const removeFileRow = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedFile = (index) => {
    updateFileRow(index, { fileObj: null, error: '' });
  };

  const handleFileSelect = (idx, e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!/(\.pdf|\.png|\.jpg|\.jpeg)$/i.test(selectedFile.name)) {
      updateFileRow(idx, {
        fileObj: null,
        error: 'Invalid format. Only PDF, PNG, JPG, and JPEG files are allowed.',
      });
      e.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      updateFileRow(idx, {
        fileObj: null,
        error: `File is too large (${formatSize(selectedFile.size)}). Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
      });
      e.target.value = '';
      return;
    }

    updateFileRow(idx, { fileObj: selectedFile, error: '' });
  };

  // ---------- save ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    const validFiles = files.filter(item => item.fileObj);

    if (validFiles.length === 0) {
      setValidationError('Please choose at least one file to upload.');
      return;
    }

    if (validFiles.some(item => item.fileObj.size > MAX_FILE_SIZE_BYTES)) {
      setValidationError(`One or more files exceed the ${MAX_FILE_SIZE_MB}MB limit. Remove them and try again.`);
      return;
    }

    setUploading(true);
    const formData = new FormData();

    formData.append('bio', studentData?.bio || '');
    formData.append('college_id', studentData?.college_id || '');
    formData.append('course_id', studentData?.course_id || '');
    formData.append('other_school', studentData?.other_school || '');
    formData.append('other_degree_program', studentData?.other_degree_program || '');
    formData.append(
      'sports_interests',
      Array.isArray(studentData?.sports_interests)
        ? studentData.sports_interests.join(', ')
        : studentData?.sports_interests || ''
    );

    validFiles.forEach((item) => {
      formData.append('titles', item.title || 'Untitled Document');
      formData.append('types', item.type);
      formData.append('files', item.fileObj);
    });

    try {
      const res = await api.patch('/students/update-portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update the dialog in place — no reload
      const updated = normalizePortfolio(res.data?.portfolio_data);
      setExisting(updated);
      setFiles([]);
      setSuccessMsg(`${validFiles.length} document${validFiles.length > 1 ? 's' : ''} uploaded.`);
      onSaved?.(updated);
    } catch (err) {
      console.error('Upload error:', err);
      setValidationError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to upload portfolio document.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5 overflow-y-auto font-['Inter']">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto border border-slate-200">
        <div className="p-8 md:p-10 max-h-[88vh] overflow-y-auto scrollbar-thin">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Upload Portfolio</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Attach achievements or resumes</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-700 hover:text-[#FF1E1E] hover:border-[#FF1E1E] transition-all shadow-sm"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* Banners */}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-2xl text-xs font-black uppercase text-green-700 tracking-wider flex items-center gap-2">
              <CheckCircle2 size={18} strokeWidth={2.5} className="shrink-0" />
              {successMsg}
            </div>
          )}
          {validationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-2xl text-xs font-black uppercase text-red-600 tracking-wider">
              {validationError}
            </div>
          )}

          {/* ===== Already uploaded ===== */}
          <div className="mb-8">
            <label className="block text-xs font-black uppercase text-[#093fb4] tracking-wider ml-1 mb-3">
              Uploaded documents ({existing.length})
            </label>

            {loadingExisting ? (
              <div className="flex items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl text-slate-500 text-xs font-black uppercase tracking-wider">
                <Spinner /> Loading your documents...
              </div>
            ) : existing.length === 0 ? (
              <div className="p-5 border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl text-center text-xs font-bold text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin">
                {existing.map((item, idx) => {
                  const isRemoving = removingPath === item.file_path;
                  const isConfirming = confirmPath === item.file_path;
                  return (
                    <div
                      key={item.file_path || idx}
                      className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#093fb4] shrink-0">
                        <FileText size={20} strokeWidth={2.5} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-900 text-sm truncate">{item.title || 'Untitled Document'}</p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider text-[#093fb4] bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5">
                          {item.type || 'Document'}
                        </span>
                      </div>

                      {isRemoving ? (
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-wider shrink-0">
                          <Spinner /> Removing
                        </div>
                      ) : isConfirming ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveExisting(item)}
                            className="text-xs font-black uppercase tracking-wider bg-[#FF1E1E] text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-all"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmPath(null)}
                            className="text-xs font-black uppercase tracking-wider bg-white border-2 border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:border-slate-400 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View document"
                              title="View"
                              className="w-9 h-9 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#093fb4] hover:border-[#093fb4] transition-all"
                            >
                              <ExternalLink size={16} strokeWidth={2.5} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmPath(item.file_path)}
                            aria-label="Remove document"
                            title="Remove"
                            className="w-9 h-9 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#FF1E1E] hover:border-[#FF1E1E] transition-all"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== Add new files ===== */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black uppercase text-[#093fb4] tracking-wider ml-1">
                New attachments ({files.length})
              </label>
              <button
                type="button"
                onClick={addFileRow}
                className="flex items-center gap-2 text-xs font-black uppercase bg-[#093fb4] text-white px-4 py-2.5 rounded-xl hover:bg-[#073496] transition-all tracking-wider"
              >
                <Plus size={16} strokeWidth={3} /> Add file
              </button>
            </div>

            {files.length === 0 ? (
              <div
                onClick={addFileRow}
                className="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 bg-slate-50 text-center hover:border-[#093fb4] hover:bg-blue-50 cursor-pointer transition-all flex flex-col items-center justify-center"
              >
                <UploadCloud className="text-slate-500 mb-3" size={40} strokeWidth={1.75} />
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Add a new document</p>
                <p className="text-xs font-bold text-slate-500 mt-1">PDF, PNG, JPG • Max {MAX_FILE_SIZE_MB}MB each</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                {files.map((item, idx) => (
                  <div key={idx} className="p-5 bg-white border-2 border-slate-200 shadow-sm rounded-2xl space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => removeFileRow(idx)}
                      aria-label="Remove attachment row"
                      className="absolute top-4 right-4 text-slate-500 hover:text-[#FF1E1E] transition-colors"
                    >
                      <Trash2 size={20} strokeWidth={2.5} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pr-10">
                      <input
                        type="text"
                        placeholder="e.g. OJT Certification..."
                        className={`${inputCls} sm:col-span-2`}
                        value={item.title}
                        onChange={e => updateFileRow(idx, { title: e.target.value })}
                      />
                      <select
                        className={inputCls}
                        value={item.type}
                        onChange={e => updateFileRow(idx, { type: e.target.value })}
                      >
                        <option value="Certificate">Certificate</option>
                        <option value="CV">CV / Resume</option>
                        <option value="Achievement">Achievement</option>
                      </select>
                    </div>

                    <div
                      className={`relative border-2 border-dashed rounded-2xl h-16 flex items-center justify-center px-4 cursor-pointer transition-all ${
                        item.error
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-300 bg-slate-50 hover:border-[#093fb4]'
                      }`}
                    >
                      {item.fileObj ? (
                        <div className="flex items-center gap-3 w-full text-sm">
                          <Award className="text-[#093fb4] shrink-0" size={22} strokeWidth={2.5} />
                          <span className="font-black text-slate-900 truncate flex-1 tracking-wide">{item.fileObj.name}</span>
                          <span className="text-xs font-bold text-slate-600 shrink-0">{formatSize(item.fileObj.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            aria-label="Remove selected file"
                            title="Remove file"
                            className="relative z-10 shrink-0 w-8 h-8 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#FF1E1E] hover:border-[#FF1E1E] transition-all"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileText size={20} strokeWidth={2.5} />
                          <span className="text-xs font-black uppercase tracking-wider">Choose File Attachment</span>
                        </div>
                      )}
                      <input
                        key={item.fileObj ? 'selected' : 'empty'}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={e => handleFileSelect(idx, e)}
                      />
                    </div>

                    {item.error ? (
                      <p className="flex items-start gap-2 text-xs font-black text-red-600 tracking-wide">
                        <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0 mt-px" />
                        {item.error}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-500">PDF, PNG, JPG • Max {MAX_FILE_SIZE_MB}MB</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="w-full bg-[#093fb4] hover:bg-[#073496] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#093fb4]/25 active:scale-[0.98] uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-2 mt-2"
            >
              {uploading ? (
                <>
                  <Spinner className="w-5 h-5" />
                  Uploading...
                </>
              ) : "Upload Portfolio"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}