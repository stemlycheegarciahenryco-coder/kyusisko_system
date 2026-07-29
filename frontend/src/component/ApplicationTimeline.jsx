import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
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

// Notes/log style timeline — compact rows instead of chat bubbles.
// Height is now a MAX height: the card shrinks to fit its content (no more
// dead whitespace when there are few or zero comments) and only scrolls
// once content exceeds this cap. `height` is kept as an alias for
// backward-compat with existing callers.
export default function ApplicationTimeline({
  applicationId,
  currentUserRole,
  currentUserId,
  maxHeight,
  height, // legacy prop name, treated as maxHeight if maxHeight isn't passed
}) {
  const cappedHeight = maxHeight ?? height ?? 320;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchComments = async (isInitial = false) => {
    try {
      const res = await api.get(`/comments/${applicationId}`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error('Error loading timeline stream:', err);
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!applicationId) return;
    setInitialLoading(true);
    fetchComments(true);

    // Silently pulls fresh notes every 15 seconds
    const intervalId = setInterval(() => fetchComments(false), 15000);
    return () => clearInterval(intervalId);
  }, [applicationId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [comments.length, initialLoading]);

  const handlePostComment = async (e) => {
    e.preventDefault();
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
        setNewComment('');
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } catch (err) {
      console.error('Error submitting message updates:', err);
    } finally {
      setSending(false);
    }
  };

  // Group comments by calendar day so we can render date separators
  const groups = [];
  comments.forEach((comment) => {
    const key = dayKey(comment.created_at);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.key === key) {
      lastGroup.items.push(comment);
    } else {
      groups.push({ key, items: [comment] });
    }
  });

  return (
    <div
      className="bg-white border border-black/5 rounded-2xl shadow-[0_1px_10px_-2px_rgba(9,63,180,0.06)] flex flex-col w-full overflow-hidden"
      style={{ maxHeight: typeof cappedHeight === 'number' ? `${cappedHeight}px` : cappedHeight }}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={12} className="text-[#093fb4]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Notes &amp; Updates</h4>
        </div>
        {comments.length > 0 && (
          <span className="text-[9px] font-black text-[#093fb4] bg-[#093fb4]/10 px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-1 timeline-scroll">
        {initialLoading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <Loader2 size={16} className="text-[#093fb4] animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Loading...</p>
          </div>
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.key} className="py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                  {formatDateLabel(group.items[0].created_at)}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="space-y-0">
                {group.items.map((comment) => {
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

                  return (
                    <div
                      key={comment.id}
                      className="flex gap-2 py-1.5 border-b border-slate-50 last:border-0"
                    >
                      <div
                        className={`w-[3px] rounded-full self-stretch shrink-0 ${
                          isAdmin ? 'bg-[#093fb4]' : 'bg-emerald-400'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] font-black text-slate-700 truncate">
                            {isMe ? 'You' : name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300 shrink-0">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium leading-snug break-words mt-0.5">
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">No notes yet</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handlePostComment} className="px-3 py-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note..."
          disabled={!applicationId}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px] text-black font-semibold placeholder-slate-400 focus:border-[#093fb4] focus:bg-white transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || sending || !applicationId}
          className="p-2 bg-[#093fb4] hover:bg-[#093fb4]/90 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 shrink-0 flex items-center justify-center w-8 h-8"
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="stroke-[2.5]" />}
        </button>
      </form>

      <style>{`
        .timeline-scroll::-webkit-scrollbar { width: 5px; }
        .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: rgba(9,63,180,0.15); border-radius: 999px; }
        .timeline-scroll::-webkit-scrollbar-thumb:hover { background: rgba(9,63,180,0.3); }
      `}</style>
    </div>
  );
}