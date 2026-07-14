import React, { useState, useEffect, useRef } from 'react';
import { Send, User2, MessageSquare, Clock, Loader2 } from 'lucide-react';
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

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  return initials.toUpperCase();
};

export default function ApplicationTimeline({ applicationId, currentUserRole, currentUserId, height = 500 }) {
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

    // Silently pulls fresh feedback loops every 15 seconds
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

  const getProfilePicUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:5000${path}`;
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
      className="bg-white border border-black/5 rounded-[28px] shadow-[0_2px_20px_-4px_rgba(9,63,180,0.08)] flex flex-col w-full overflow-hidden"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#093fb4]/[0.04] to-transparent shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#093fb4] flex items-center justify-center text-white shadow-sm shadow-[#093fb4]/30">
            <MessageSquare size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Application Timeline</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
              Official compliance review &amp; notes
            </p>
          </div>
        </div>
        {comments.length > 0 && (
          <span className="text-[10px] font-black text-[#093fb4] bg-[#093fb4]/10 px-2 py-1 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-slate-50/40 timeline-scroll">
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2.5">
            <Loader2 size={22} className="text-[#093fb4] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Loading timeline...</p>
          </div>
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200/70" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/40 px-1">
                  {formatDateLabel(group.items[0].created_at)}
                </span>
                <div className="flex-1 h-px bg-slate-200/70" />
              </div>

              {group.items.map((comment) => {
                const isMe =
                  (currentUserRole === 'student' &&
                    comment.sender_role === 'student' &&
                    String(comment.student_id) === String(currentUserId)) ||
                  (currentUserRole === 'sub_admin' &&
                    comment.sender_role === 'sub_admin' &&
                    String(comment.sub_admin_id) === String(currentUserId));

                const name =
                  comment.sender_role === 'student'
                    ? `${comment.sfirst_name || ''} ${comment.slast_name || ''}`.trim()
                    : comment.admin_username || 'Portal Operations';

                return (
                  <div
                    key={comment.id}
                    className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1 flex items-center justify-center border border-white shadow-sm">
                      {comment.sender_role === 'student' && comment.sprofile_pic ? (
                        <img
                          src={getProfilePicUrl(comment.sprofile_pic)}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-[9px] font-black ${
                            isMe ? 'bg-[#093fb4] text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {name && name !== ' ' ? getInitials(name) : <User2 size={13} />}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {isMe ? 'You' : name || 'Portal Operations'}
                      </div>
                      <div
                        className={`inline-block p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm break-words ${
                          isMe
                            ? 'bg-[#093fb4] text-white rounded-tr-md'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-md'
                        }`}
                      >
                        {comment.comment_text}
                      </div>
                      <div
                        className={`text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <Clock size={9} />
                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
              <MessageSquare size={20} className="text-slate-300 stroke-[1.5]" />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Timeline Clear</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider mt-0.5">
              No comments or adjustments logged yet
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handlePostComment} className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2.5 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type an evaluation note or message..."
          disabled={!applicationId}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs text-black font-semibold placeholder-slate-400 focus:border-[#093fb4] focus:bg-white transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || sending || !applicationId}
          className="p-3 bg-[#093fb4] hover:bg-[#093fb4]/90 disabled:opacity-40 text-white rounded-2xl shadow-md shadow-[#093fb4]/20 transition-all active:scale-95 shrink-0 flex items-center justify-center w-11 h-11"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="stroke-[2.5]" />}
        </button>
      </form>

      <style>{`
        .timeline-scroll::-webkit-scrollbar { width: 6px; }
        .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: rgba(9,63,180,0.15); border-radius: 999px; }
        .timeline-scroll::-webkit-scrollbar-thumb:hover { background: rgba(9,63,180,0.3); }
      `}</style>
    </div>
  );
}