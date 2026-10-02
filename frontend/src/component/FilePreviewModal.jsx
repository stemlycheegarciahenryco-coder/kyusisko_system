import React, { useEffect } from 'react';
import { X, ExternalLink, FileText, Download } from 'lucide-react';

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
const WORD_EXT = ['doc', 'docx'];

const getExt = (path = '') =>
  (path.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();

// Google's viewer can only open files that are reachable from the internet
const isPublicUrl = (path) => {
  try {
    const u = new URL(path, window.location.href);
    return u.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(u.hostname);
  } catch {
    return false;
  }
};

/**
 * In-page preview of an uploaded document.
 * Usage: <FilePreviewModal file={{ url, name }} onClose={() => ...} />
 * Renders nothing when `file` is null.
 */
export default function FilePreviewModal({ file, onClose }) {
  useEffect(() => {
    if (!file) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, onClose]);

  if (!file) return null;

  const ext = getExt(file.url);
  const isPdf = ext === 'pdf';
  const isImage = IMAGE_EXT.includes(ext);
  const isWord = WORD_EXT.includes(ext);
  const useGoogleViewer = isWord && isPublicUrl(file.url);

  const absoluteUrl = (() => {
    try { return new URL(file.url, window.location.href).href; } catch { return file.url; }
  })();

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b-2 border-black/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#093fb4]/10 flex items-center justify-center shrink-0">
              <FileText size={16} strokeWidth={2.5} className="text-[#093fb4]" />
            </div>
            <p className="text-sm font-black uppercase tracking-wide text-black truncate">{file.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/60 hover:text-[#093fb4] hover:bg-[#093fb4]/5 transition-colors"
            >
              <ExternalLink size={14} strokeWidth={2.5} /> Open
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/60 transition-colors"
              aria-label="Close preview"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 bg-black/5">
          {isPdf && (
            <iframe
              title={file.name}
              src={`${file.url}#toolbar=1&view=FitH`}
              className="w-full h-full border-0 bg-white"
            />
          )}

          {isImage && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded-xl shadow" />
            </div>
          )}

          {useGoogleViewer && (
            <iframe
              title={file.name}
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`}
              className="w-full h-full border-0 bg-white"
            />
          )}

          {!isPdf && !isImage && !useGoogleViewer && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 p-8">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <FileText size={28} className="text-black/30" />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-black/60">
                {isWord ? 'Word files can’t be previewed here' : 'No preview available for this file type'}
              </p>
              <p className="text-xs font-bold text-black/40 max-w-sm">
                {isWord
                  ? 'Browsers can’t display .doc / .docx directly. Download it to view the document.'
                  : 'Download the file to open it on your device.'}
              </p>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                download
                className="mt-2 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#093fb4] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#072e82] transition-colors"
              >
                <Download size={14} strokeWidth={2.5} /> Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}