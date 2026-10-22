import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganization } from './useOrganization';
import { useDialog } from './rootadmin/DialogModal';
import api from './api';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES_PER_FIELD = 3;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');
const ALLOWED_LABEL = 'PDF, JPG or PNG';

const FILE_INPUT_BASE =
  'w-full text-caption font-medium text-slate-500 bg-white border rounded-xl p-2.5 transition-all focus:outline-none file:mr-4 file:px-4 file:py-2 file:rounded-xl file:border-0 file:text-label file:font-black file:uppercase file:tracking-wider file:bg-brand-soft file:text-brand hover:file:bg-brand/10';
const FILE_INPUT_STATE = {
  idle: 'border-slate-300 focus:border-brand',
  error: 'border-red-400 focus:border-red-500',
  ok: 'border-emerald-400 focus:border-emerald-500',
};
const FIELD_ERROR = 'text-caption font-bold text-red-600';
const FILE_ROW =
  'flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-caption font-semibold text-slate-700';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getExt = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');
const fileKey = (f) => `${f.name}|${f.size}|${f.lastModified}`;

const validateSelection = (files, otherFields) => {
  const problems = [];

  if (files.length > MAX_FILES_PER_FIELD) {
    problems.push(`Select up to ${MAX_FILES_PER_FIELD} files per requirement (you chose ${files.length}).`);
  }

  const usedElsewhere = new Map();
  Object.entries(otherFields).forEach(([name, list]) =>
    list.forEach((f) => usedElsewhere.set(fileKey(f), name))
  );

  const seen = new Set();
  files.forEach((f) => {
    const ext = getExt(f.name);
    const badMime = f.type && !ALLOWED_MIME.includes(f.type);

    if (!ALLOWED_EXTENSIONS.includes(ext) || badMime) {
      problems.push(`${f.name}: unsupported file type. Use ${ALLOWED_LABEL}.`);
    } else if (f.size === 0) {
      problems.push(`${f.name}: the file is empty.`);
    } else if (f.size > MAX_FILE_SIZE) {
      // THIS CATCHES THE 19MB FILE
      problems.push(`${f.name}: ${formatSize(f.size)} is over the ${MAX_FILE_SIZE_MB} MB limit.`);
    } else if (seen.has(fileKey(f))) {
      problems.push(`${f.name}: selected more than once.`);
    } else if (usedElsewhere.has(fileKey(f))) {
      problems.push(`${f.name}: already attached to "${usedElsewhere.get(fileKey(f))}".`);
    }
    seen.add(fileKey(f));
  });

  return problems;
};

const submittedKey = (id) => `compliance_submitted_${id}`;
const wasSubmittedLocally = (id) => {
  try { return localStorage.getItem(submittedKey(id)) === '1'; } catch { return false; }
};
const markSubmittedLocally = (id) => {
  try { localStorage.setItem(submittedKey(id), '1'); } catch { /* ignore */ }
};
const clearSubmittedLocally = (id) => {
  try { localStorage.removeItem(submittedKey(id)); } catch { /* ignore */ }
};

const resolveLock = (data, id) => {
  const status = typeof data.status === 'string' ? data.status.trim().toLowerCase() : '';
  if (status === 'approved' || status === 'rejected') return status;
  if (data.compliance_submitted === true || data.has_submitted === true) return 'submitted';
  if (status === 'comply') {
    clearSubmittedLocally(id); 
    return null;
  }
  if (status === 'pending') return 'submitted';
  if (status) return 'closed'; 
  return wasSubmittedLocally(id) ? 'submitted' : null;
};

const LOCKED_VIEWS = {
  submitted: {
    variant: 'success',
    badge: 'Submitted · Under review',
    title: 'Documents Submitted',
    body: 'Your compliance documents have been received and are under review by our System Administrator. You will be notified once a decision is made. No further uploads are needed.',
  },
  approved: {
    variant: 'success',
    badge: 'Approved',
    title: 'Application Approved',
    body: 'Your compliance documents were reviewed and your organization is approved. This upload link is now closed.',
  },
  rejected: {
    variant: 'error',
    badge: 'Rejected',
    title: 'Application Rejected',
    body: 'This application was rejected, so documents can no longer be uploaded through this link.',
  },
  closed: {
    variant: 'warning',
    badge: 'Link closed',
    title: 'Upload Link Closed',
    body: 'This application is not waiting on compliance documents right now, so uploads are closed.',
  },
};

const VARIANTS = {
  success: { wrap: 'bg-emerald-50 text-emerald-600', icon: <polyline points="20 6 9 17 4 12" /> },
  error: { wrap: 'bg-red-50 text-red-600', icon: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> },
  warning: { wrap: 'bg-amber-50 text-amber-600', icon: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
};

const Icon = ({ variant, size = 30, stroke = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {VARIANTS[variant].icon}
  </svg>
);

export const CompliancePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleComplianceSubmit, loading } = useOrganization();
  const { notify, dialogElement } = useDialog();

  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lock, setLock] = useState(null); 

  const [orgDetails, setOrgDetails] = useState({ org_name: '', provider_type: '', rejection_reason: '', required_fields: [] });
  const [dynamicFiles, setDynamicFiles] = useState({});
  const [fieldErrors, setFieldErrors] = useState({}); 
  const inputRefs = useRef({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/onboarding-orgs/compliance-details/${id}`);
        let parsedFields = [];
        try {
          if (response.data.required_fields) {
            parsedFields = typeof response.data.required_fields === 'string' ? JSON.parse(response.data.required_fields) : response.data.required_fields;
          }
        } catch (e) { console.error('Failed to parse required_fields', e); }

        setOrgDetails({ ...response.data, required_fields: parsedFields });
        setLock(resolveLock(response.data, id));
      } catch (err) {
        setLoadError(err.response?.data?.error || 'Failed to load application details.');
      } finally {
        setFetching(false);
      }
    };
    fetchDetails();
  }, [id]);

  const requiredFields = orgDetails.required_fields || [];
  const uploadedCount = requiredFields.filter((f) => (dynamicFiles[f] || []).length > 0).length;
  const hasErrors = Object.values(fieldErrors).some((list) => list.length > 0);
  const canSubmit = requiredFields.length > 0 && uploadedCount === requiredFields.length && !hasErrors && !loading;

  const clearField = (fieldName) => {
    if (inputRefs.current[fieldName]) inputRefs.current[fieldName].value = '';
    setDynamicFiles((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleDynamicFileChange = (fieldName, fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return clearField(fieldName); 

    const { [fieldName]: _current, ...otherFields } = dynamicFiles;
    const problems = validateSelection(files, otherFields);

    if (problems.length > 0) {
      // INSTANTLY REJECT AND CLEAR THE 19MB FILE
      if (inputRefs.current[fieldName]) inputRefs.current[fieldName].value = '';
      setDynamicFiles((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      setFieldErrors((prev) => ({ ...prev, [fieldName]: problems }));

      // INSTANTLY POP UP THE DIALOG SO THEY KNOW IT WAS REJECTED
      notify({
        variant: 'error',
        title: 'Invalid File',
        body: (
          <div className="space-y-2 mt-2 text-left">
            <p className="text-sm font-bold text-slate-700">The file could not be attached:</p>
            {problems.map((p, i) => (
              <p key={i} className="text-sm text-red-600 font-semibold">• {p}</p>
            ))}
          </div>
        ),
        confirmText: 'Understood'
      });
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setDynamicFiles((prev) => ({ ...prev, [fieldName]: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return; 

    const result = await handleComplianceSubmit(id, dynamicFiles, true);

    if (result.success) {
      markSubmittedLocally(id);
      setDynamicFiles({});
      setLock('submitted');
      await notify({
        variant: 'success',
        title: 'Documents Submitted!',
        body: <p>Your compliance updates were submitted. Your account is now back under review.</p>,
        confirmText: 'Return Home'
      });
      navigate('/');
    } else {
      notify({
        variant: 'error',
        title: 'Submission Failed',
        body: <p>{result.error}</p>,
        confirmText: 'Try Again',
      });
    }
  };

  if (fetching) return <div className="flex justify-center items-center h-screen bg-slate-50"><p className="ui-subtitle animate-pulse">Syncing application context...</p></div>;

  const pageShell = (content) => (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">
      <div className="ui-card max-w-xl w-full p-8 shadow-2xl shadow-brand/5 z-10">{content}</div>
      {dialogElement} 
    </div>
  );

  if (loadError) {
    return pageShell(
      <div className="text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${VARIANTS.error.wrap}`}><Icon variant="error" /></div>
        <h2 className="ui-page-title !text-xl mb-2">Unable to Load</h2>
        <p className="ui-body mb-6">{loadError}</p>
        <button type="button" onClick={() => navigate('/')} className="ui-btn-secondary w-full">Return Home</button>
      </div>
    );
  }

  if (lock) {
    const view = LOCKED_VIEWS[lock] || LOCKED_VIEWS.closed;
    const badgeTone = { success: 'bg-emerald-50 text-emerald-700 border-emerald-200', error: 'bg-red-50 text-red-700 border-red-200', warning: 'bg-amber-50 text-amber-700 border-amber-200' }[view.variant];
    return pageShell(
      <div className="text-center">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${VARIANTS[view.variant].wrap}`}><Icon variant={view.variant} size={40} stroke={3} /></div>
        <p className="home-eyebrow text-brand mb-1">Security &amp; Compliance</p>
        <h2 className="ui-page-title mb-3">{view.title}</h2>
        {orgDetails.org_name && <p className="ui-subtitle mb-3"><span className="text-brand">{orgDetails.org_name}</span></p>}
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-micro font-black uppercase tracking-widest mb-5 ${badgeTone}`}>{view.badge}</span>
        <p className="ui-body mb-8">{view.body}</p>
        <button type="button" onClick={() => navigate('/')} className="ui-btn-primary w-full">Return Home</button>
      </div>
    );
  }

  return pageShell(
    <>
      <div className="text-center mb-8">
        <p className="home-eyebrow text-brand mb-1">Security &amp; Compliance</p>
        <h2 className="ui-page-title !text-3xl italic">Compliance Portal</h2>
        <p className="ui-subtitle mt-2">Resubmit verification records for <span className="text-brand">{orgDetails.org_name}</span></p>
      </div>

      <div className="border p-5 rounded-2xl mb-6 bg-brand-soft border-brand/20">
        <h3 className="text-label font-black uppercase tracking-widest mb-1 text-brand">Requested Documents / Notes</h3>
        <p className="ui-body !text-brand-dark">"{orgDetails.rejection_reason || 'Please upload your pending files required below.'}"</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-micro font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Specific Requirements</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <p className="text-caption font-semibold text-slate-500">{ALLOWED_LABEL}, up to <strong className="text-slate-700">{MAX_FILE_SIZE_MB} MB</strong> each, max <strong className="text-slate-700">{MAX_FILES_PER_FIELD} files</strong> per requirement.</p>

          {requiredFields.length > 0 ? (
            requiredFields.map((field) => {
              const files = dynamicFiles[field] || [];
              const errors = fieldErrors[field] || [];
              const errId = `err-${field.replace(/\s+/g, '-')}`;
              return (
                <div key={field} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="ui-label block" htmlFor={`file-${field}`}>Upload {field} <span className="text-red-500">*</span></label>
                    {files.length > 0 && <button type="button" onClick={() => clearField(field)} className="text-label font-black uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors">Clear</button>}
                  </div>
                  <input
                    id={`file-${field}`}
                    ref={(el) => { inputRefs.current[field] = el; }}
                    type="file"
                    multiple
                    accept={ACCEPT_ATTR}
                    onChange={(e) => handleDynamicFileChange(field, e.target.files)}
                    aria-invalid={errors.length > 0}
                    aria-describedby={errors.length > 0 ? errId : undefined}
                    className={`${FILE_INPUT_BASE} ${FILE_INPUT_STATE[errors.length > 0 ? 'error' : files.length > 0 ? 'ok' : 'idle']}`}
                  />
                  {errors.length > 0 && <ul id={errId} role="alert" className="space-y-0.5">{errors.map((msg, i) => <li key={i} className={FIELD_ERROR}>{msg}</li>)}</ul>}
                  {files.length > 0 && (
                    <ul className="space-y-1">
                      {files.map((f) => (
                        <li key={fileKey(f)} className={FILE_ROW}>
                          <span className="truncate">{f.name}</span>
                          <span className="text-micro font-black text-slate-400 shrink-0">{formatSize(f.size)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          ) : (<p className="text-caption text-slate-400 italic text-center py-4">No specific document requirements currently specified.</p>)}
        </div>

        <div className="space-y-2">
          <button type="submit" disabled={!canSubmit} className="ui-btn-primary w-full !py-4">
            {loading ? 'Uploading Records...' : 'Submit Compliance Updates'}
          </button>
        </div>
      </form>
    </>
  );
};