import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2, Pin } from 'lucide-react';
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

export default function ApplicationTimeline({
  applicationId,
  currentUserRole,
  currentUserId,
  maxHeight,
  height, 
}) {
  const cappedHeight = maxHeight ?? height ?? 420;

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
      className="bg-[#FFFCFB] border border-black/8 rounded-2xl shadow-sm flex flex-col w-full overflow-hidden relative"
      style={{ maxHeight: typeof cappedHeight === 'number' ? `${cappedHeight}px` : cappedHeight }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-[#093fb4]" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Application Notes</h4>
        </div>
        {comments.length > 0 && (
          <span className="text-[10px] font-black text-white bg-[#093fb4] px-2 py-0.5 rounded-full shadow-sm">
            {comments.length}
          </span>
        )}
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto p-5 timeline-scroll relative">
        {/* Background Vertical Timeline Dashed Line */}
        <div className="absolute top-0 bottom-0 left-[35px] w-px border-l-2 border-dashed border-slate-200 -z-0" />

        {initialLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <Loader2 size={20} className="text-[#093fb4] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Notes...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-6 z-10 relative">
            {groups.map((group) => (
              <div key={group.key} className="space-y-4">
                
                {/* Date Separator Pill */}
                <div className="flex items-center gap-4 relative">
                  <div className="w-4 h-4 rounded-full bg-slate-200 border-4 border-[#FFFCFB] z-10 shrink-0 shadow-sm ml-[7px]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                    {formatDateLabel(group.items[0].created_at)}
                  </span>
                </div>

                <div className="space-y-4 pl-[38px]">
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

                    // Sticky Note Theming based on role
                    const noteTheme = isAdmin 
                      ? 'bg-blue-50/80 border-blue-100 shadow-blue-900/5 text-blue-900' 
                      : 'bg-emerald-50/80 border-emerald-100 shadow-emerald-900/5 text-emerald-900';
                      
                    const headerTheme = isAdmin ? 'text-blue-700' : 'text-emerald-700';
                    const avatarTheme = isAdmin ? 'bg-blue-200 text-blue-700' : 'bg-emerald-200 text-emerald-700';

                    return (
                      <div key={comment.id} className="relative group">
                        {/* Pin Icon on top center of the note */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-slate-300 group-hover:text-slate-400 transition-colors z-10">
                          <Pin size={16} className="fill-slate-100" />
                        </div>

                        {/* Sticky Note Container */}
                        <div className={`relative p-4 rounded-xl rounded-br-2xl border shadow-sm transition-all hover:shadow-md ${noteTheme}`}>
                          
                          {/* Folded Corner Effect */}
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-tl-xl border-t border-l ${isAdmin ? 'bg-blue-100 border-blue-200' : 'bg-emerald-100 border-emerald-200'}`} />

                          {/* Note Header */}
                          <div className="flex items-start justify-between mb-3 border-b border-black/5 pb-2">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar Initials */}
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black uppercase shrink-0 ${avatarTheme}`}>
                                {isMe ? 'ME' : name.substring(0, 2)}
                              </div>
                              <div>
                                <p className={`text-[12px] font-black leading-none ${headerTheme}`}>
                                  {isMe ? 'You' : name}
                                </p>
                                <p className="text-[10px] font-bold text-black/40 mt-1 uppercase tracking-wider">
                                  {formatTime(comment.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Note Body */}
                          <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-words pr-2">
                            {comment.comment_text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center z-10 relative">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">No notes pinned yet</p>
            <p className="text-[12px] text-slate-400 font-medium mt-1 max-w-[200px]">Updates and messages will appear here as sticky notes.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Note Input Form */}
      <form onSubmit={handlePostComment} className="p-3 border-t border-black/5 bg-white shrink-0 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handlePostComment(e);
            }
          }}
          placeholder="Type a new note... (Press Enter to post)"
          disabled={!applicationId}
          rows={2}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[12px] text-black font-semibold placeholder-slate-400 focus:border-[#093fb4] focus:bg-white focus:ring-4 focus:ring-[#093fb4]/10 transition-all disabled:opacity-50 resize-none"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || sending || !applicationId}
          className="p-3 bg-[#093fb4] hover:bg-[#08308b] disabled:opacity-50 disabled:hover:bg-[#093fb4] text-white rounded-xl transition-all active:scale-95 shrink-0 flex items-center justify-center h-[46px] w-[46px] shadow-md shadow-[#093fb4]/20"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="stroke-[2.5]" />}
        </button>
      </form>

      <style>{`
        .timeline-scroll::-webkit-scrollbar { width: 6px; }
        .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: rgba(9,63,180,0.1); border-radius: 999px; }
        .timeline-scroll::-webkit-scrollbar-thumb:hover { background: rgba(9,63,180,0.25); }
      `}</style>
    </div>
  );
}