import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, ShieldAlert, ArrowLeft, Clock, MessageSquare, Search, User } from 'lucide-react';
import api from '../api';

const BASE_URL = 'http://localhost:5000';

export default function OrgMessages() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const orgId = parseInt(localStorage.getItem('userId') || localStorage.getItem('orgId'));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchThreads = async (showLoading = true) => {
    if (showLoading) setLoadingThreads(true);
    try {
      const res = await api.get('/messages/threads');
      const uniqueThreads = res.data.data.filter((thread, index, self) =>
        index === self.findIndex((t) => (
          t.partner_id === thread.partner_id &&
          (t.thread_id !== null || thread.thread_id === null)
        ))
      );
      setThreads(uniqueThreads);
    } catch (err) {
      console.error("Error loading org threads:", err);
    } finally {
      if (showLoading) setLoadingThreads(false);
    }
  };

  const fetchMessages = async (threadId, showLoading = false) => {
    if (!threadId || threadId === 'NaN' || isNaN(Number(threadId))) {
      setMessages([]);
      return;
    }
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/thread/${threadId}`);
      setMessages(res.data.data);
    } catch (err) {
      console.error("Error loading thread messages:", err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads(false);
      if (activeThread && activeThread.thread_id) {
        fetchMessages(activeThread.thread_id, false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeThread]);

  const handleSelectThread = async (thread) => {
    setActiveThread(thread);
    setPartnerStatus(null);
    setStatusLoading(true);
    if (thread.thread_id) {
      fetchMessages(thread.thread_id, true);
    } else {
      setMessages([]);
    }
    try {
      const res = await api.get(`/messages/student-status/${thread.partner_id}`);
      setPartnerStatus(res.data.status?.toLowerCase());
    } catch (err) {
      console.error("Failed to fetch partner status:", err);
      setPartnerStatus('unknown');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;
    try {
      const payload = {
        targetId: activeThread.partner_id,
        messageText: newMessage.trim()
      };
      const res = await api.post('/messages/send', payload);
      if (res.data.success) {
        const savedMsg = res.data.data;
        setMessages(prev => [...prev, savedMsg]);
        setNewMessage('');
        if (!activeThread.thread_id) {
          setActiveThread(prev => ({ ...prev, thread_id: savedMsg.thread_id }));
        }
        fetchThreads(false);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const getStudentPic = (picPath) => {
    if (!picPath) return null;
    return `${BASE_URL}/${picPath}`;
  };

  const isEligible = ['approved', 'renewal'].includes(partnerStatus);

  const filteredThreads = threads.filter(t =>
    t.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[82vh] bg-[#FFFCFB] rounded-2xl shadow-sm border border-black/5 font-['Inter'] flex overflow-hidden">

      {/* LEFT COLUMN: Threads Sidebar — narrow */}
      <div className={`w-full md:w-64 border-r border-slate-100 flex flex-col h-full bg-[#FFFCFB] ${activeThread ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <MessageSquare size={15} className="text-[#093fb4]" /> Applicants
          </h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">
            Student Inquiries Desk
          </p>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#093fb4]/20 focus:bg-[#FFFCFB] transition-all"
            />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingThreads ? (
            <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">
              Syncing...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-10 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 m-2">
              <Mail size={22} className="text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-400 uppercase">No conversations</p>
            </div>
          ) : (
            filteredThreads.map(t => {
              const uniqueKey = t.thread_id ? `active-${t.thread_id}` : `new-${t.partner_id}`;
              const isActive = activeThread?.thread_id === t.thread_id && t.thread_id !== null;
              const studentPicUrl = getStudentPic(t.student_pic);

              return (
                <div
                  key={uniqueKey}
                  onClick={() => handleSelectThread(t)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-blue-50/80 border-[#093fb4]/20'
                      : 'bg-[#FFFCFB] border-slate-100 hover:border-blue-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Student Avatar */}
                    <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center">
                      {studentPicUrl ? (
                        <img src={studentPicUrl} alt={t.partner_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-[#093fb4]">
                          {t.partner_name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className={`font-black text-xs uppercase tracking-tight truncate ${isActive ? 'text-[#093fb4]' : 'text-slate-800'}`}>
                          {t.partner_name}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0 ml-1">
                          {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : 'Now'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {t.partner_email}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5 leading-snug group-hover:text-slate-700 transition-colors">
                        {t.last_message || "No conversation history"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Chat View */}
      <div className={`flex-1 flex flex-col h-full bg-[#FFFCFB] ${!activeThread ? 'hidden md:flex items-center justify-center bg-slate-50/30' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-[#FFFCFB]">
              <button
                onClick={() => { setActiveThread(null); setPartnerStatus(null); }}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:text-[#093fb4] md:hidden transition-colors"
              >
                <ArrowLeft size={14} />
              </button>

              {/* Student Profile Pic in Header */}
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                {activeThread.student_pic ? (
                  <img
                    src={getStudentPic(activeThread.student_pic)}
                    alt={activeThread.partner_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-black text-[#093fb4]">
                    {activeThread.partner_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight truncate">
                  {activeThread.partner_name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                    {activeThread.partner_email}
                  </p>
                  {/* Status pill */}
                  {!statusLoading && partnerStatus && (
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                      isEligible
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {partnerStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/20">
              {loadingMessages ? (
                <div className="text-center py-10 text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">No messages yet — start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_type === 'sub_admin' && parseInt(msg.sender_id) === orgId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-[#093fb4] text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-xs'
                      }`}>
                        <p className="font-medium leading-relaxed break-words whitespace-pre-line">
                          {msg.message_text}
                        </p>
                        <p className={`text-[9px] font-bold mt-1 text-right uppercase tracking-wider ${isMe ? 'text-white/50' : 'text-slate-300'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Panel */}
            {statusLoading ? (
              <div className="p-3 border-t border-slate-100 bg-[#FFFCFB]">
                <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : isEligible ? (
              <form onSubmit={handleSendMessage} className="p-3 bg-[#FFFCFB] border-t border-slate-100 flex gap-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send instructions or ask for corrections..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#093fb4]/30 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-[#093fb4] text-white rounded-xl hover:bg-[#093fb4]/90 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <Send size={13} strokeWidth={2.5} />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2.5">
                <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-600 uppercase tracking-wide">Messaging Unavailable</p>
                  <p className="text-xs text-amber-500 font-medium mt-0.5">
                    This applicant's status is <span className="font-black">{partnerStatus}</span>. Only approved or renewal scholars can message.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 max-w-xs">
            <div className="w-10 h-10 bg-blue-50 text-[#093fb4] border border-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Open a Conversation</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 leading-normal">
              Select an applicant from the sidebar to review messages or issue instructions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}