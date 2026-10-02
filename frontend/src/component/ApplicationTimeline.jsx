import React, { useState, useEffect, useRef } from 'react';
import { Plus, StickyNote, Loader2, Pin, X } from 'lucide-react';
import api from '../api';

const dayKey = (d) => new Date(d).toDateString();

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/*
  Notes board.
  - By default it grows with the page (no inner scrollbar), so the browser scrollbar is the only one.
  - Pass `height` / `maxHeight` only if you want the board to scroll inside a fixed-size box
    (e.g. a narrow admin side panel).
*/
export default function ApplicationTimeline({
  applicationId,
  currentUserRole,
  currentUserId,
  maxHeight,
  height,
}) {
  const cappedHeight = maxHeight ?? height ?? null;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const inputRef = useRef(null);

  const fetchComments = async (isInitial = false) => {
    try {
      const res = await api.get(`/comments/${applicationId}`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!applicationId) return;
    setInitialLoading(true);
    fetchComments(true);

    const intervalId = setInterval(() => fetchComments(false), 15000);
    return () => clearInterval(intervalId);
  }, [applicationId]);

  useEffect(() => {
    if (composerOpen) inputRef.current?.focus();
  }, [composerOpen]);

  const closeComposer = () => {
    setComposerOpen(false);
    setNewComment('');
  };

  const handlePostNote = async (e) => {
    e?.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/comments/${applicationId}`, {
        sender_role: currentUserRole,
        sender_id: currentUserId,
        comment_text: trimmed,
      });

      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        closeComposer();
      }
    } catch (err) {
      console.error('Error posting note:', err);
    } finally {
      setSending(false);
    }
  };

  // Newest note first, like a board where the latest note is stuck on top
  const notes = [...comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div
      className="bg-[#FFFCFB] border-2 border-black/5 rounded-3xl shadow-sm flex flex-col w-full overflow-hidden"
      style={cappedHeight ? { maxHeight: typeof cappedHeight === 'number' ? `${cappedHeight}px` : cappedHeight } : undefined}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between gap-3 shrink-0 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#093fb4]/10 text-[#093fb4] flex items-center justify-center shrink-0">
            <StickyNote size={16} strokeWidth={2.5} />
          </div>
          <h4 className="text-base font-black uppercase tracking-wider text-slate-800">Notes</h4>
          {comments.length > 0 && (
            <span className="text-[10px] font-black text-white bg-[#093fb4] px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>

        {!composerOpen && (
          <button
            onClick={() => setComposerOpen(true)}
            disabled={!applicationId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#093fb4] hover:bg-[#072e82] text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-[#093fb4]/20 disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={3} /> Add Note
          </button>
        )}
      </div>

      {/* Board */}
      <div className={`p-4 space-y-4 ${cappedHeight ? 'flex-1 overflow-y-auto timeline-scroll' : ''}`}>

        {/* New note composer */}
        {composerOpen && (
          <form
            onSubmit={handlePostNote}
            className="relative bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-amber-300">
              <Pin size={16} className="fill-amber-100" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">New note</p>
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostNote(e);
                if (e.key === 'Escape') closeComposer();
              }}
              placeholder="Write your note here..."
              rows={4}
              className="w-full px-3 py-2.5 bg-white/70 border border-amber-200 rounded-xl outline-none text-[13px] text-black font-medium placeholder-amber-700/40 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-200/50 transition-all resize-none"
            />
            <div className="flex items-center justify-between gap-2 mt-3">
              <p className="text-[10px] font-bold text-amber-700/60">Ctrl + Enter to post</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeComposer}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/50 hover:bg-black/5 transition-colors"
                >
                  <X size={13} strokeWidth={2.5} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim() || sending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#093fb4] hover:bg-[#072e82] text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                >
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Pin size={13} strokeWidth={2.5} />}
                  Pin Note
                </button>
              </div>
            </div>
          </form>
        )}

        {initialLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <Loader2 size={20} className="text-[#093fb4] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Notes...</p>
          </div>
        ) : notes.length > 0 ? (
          notes.map((comment) => {
            const isAdmin = comment.sender_role !== 'student';
            const isMe =
              (currentUserRole === 'student' &&
                comment.sender_role === 'student' &&
                String(comment.student_id) === String(currentUserId)) ||
              (currentUserRole === 'sub_admin' &&
                comment.sender_role === 'sub_admin' &&
                String(comment.sub_admin_id) === String(currentUserId));

            const name =
              comment.sender_role === 'student'
                ? `${comment.sfirst_name || ''} ${comment.slast_name || ''}`.trim() || 'Student'
                : comment.admin_username || 'Portal Operations';

            const noteTheme = isAdmin
              ? 'bg-blue-50/80 border-blue-100 shadow-blue-900/5 text-blue-900'
              : 'bg-emerald-50/80 border-emerald-100 shadow-emerald-900/5 text-emerald-900';
            const headerTheme = isAdmin ? 'text-blue-700' : 'text-emerald-700';
            const avatarTheme = isAdmin ? 'bg-blue-200 text-blue-700' : 'bg-emerald-200 text-emerald-700';

            return (
              <div key={comment.id} className="relative group pt-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-slate-300 group-hover:text-slate-400 transition-colors z-10">
                  <Pin size={16} className="fill-slate-100" />
                </div>

                <div className={`relative p-4 rounded-xl rounded-br-2xl border shadow-sm transition-all hover:shadow-md ${noteTheme}`}>
                  {/* Folded corner */}
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-tl-xl border-t border-l ${isAdmin ? 'bg-blue-100 border-blue-200' : 'bg-emerald-100 border-emerald-200'}`} />

                  <div className="flex items-center gap-2.5 mb-3 border-b border-black/5 pb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black uppercase shrink-0 ${avatarTheme}`}>
                      {isMe ? 'ME' : name.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-black leading-none truncate ${headerTheme}`}>
                        {isMe ? 'You' : name}
                      </p>
                      <p className="text-[10px] font-bold text-black/40 mt-1 uppercase tracking-wider">
                        {formatDateLabel(comment.created_at)} · {formatTime(comment.created_at)}
                      </p>
                    </div>
                  </div>

                  <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-words pr-2">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          !composerOpen && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <StickyNote size={24} className="text-slate-300" />
              </div>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">No notes yet</p>
              <p className="text-[12px] text-slate-400 font-medium mt-1 max-w-[220px]">
                Tap “Add Note” to pin a message about this application.
              </p>
            </div>
          )
        )}
      </div>

      <style>{`
        .timeline-scroll::-webkit-scrollbar { width: 6px; }
        .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: rgba(9,63,180,0.1); border-radius: 999px; }
        .timeline-scroll::-webkit-scrollbar-thumb:hover { background: rgba(9,63,180,0.25); }
      `}</style>
    </div>
  );
}