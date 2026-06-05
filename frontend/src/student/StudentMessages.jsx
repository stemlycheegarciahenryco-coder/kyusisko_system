import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, ShieldAlert, ArrowLeft, Clock, MessageSquare } from 'lucide-react';
import api from '../api';

const BASE_URL = 'http://localhost:5000';

export default function StudentMessages() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [threadStatus, setThreadStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const studentId = parseInt(localStorage.getItem('userId') || localStorage.getItem('studentId'));

  const isEligible = ['approved', 'renewal'].includes(threadStatus);

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
      console.error("Error loading student threads:", err);
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
      console.error("Error loading chat conversation history:", err);
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
    setThreadStatus(null);
    setStatusLoading(true);
    if (thread.thread_id) {
      fetchMessages(thread.thread_id, true);
    } else {
      setMessages([]);
    }
    try {
      const res = await api.get(`/messages/my-status/${thread.partner_id}`);
      setThreadStatus(res.data.status?.toLowerCase());
    } catch (err) {
      console.error("Failed to fetch thread status:", err);
      setThreadStatus('unknown');
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

  const getPicUrl = (picPath) => {
    if (!picPath) return null;
    return `${BASE_URL}/${picPath}`;
  };

  return (
    <div className="h-[82vh] bg-white rounded-2xl shadow-sm border border-slate-100 font-['Inter'] flex overflow-hidden">

      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-64 border-r border-slate-100 flex flex-col h-full bg-white ${activeThread ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#093fb4]/10 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare size={14} className="text-[#093fb4]" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">
                Inbox
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Scholarship Messages
              </p>
            </div>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {loadingThreads ? (
            <div className="space-y-2 p-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 animate-pulse flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 px-4 m-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Mail size={18} className="text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase">No messages yet</p>
              <p className="text-[10px] text-slate-300 mt-1">Organizations will appear here once they reach out.</p>
            </div>
          ) : (
            threads.map((t) => {
              const uniqueKey = t.thread_id ? `active-${t.thread_id}` : `new-${t.partner_id}`;
              const isActive = activeThread?.thread_id === t.thread_id && t.thread_id !== null;
              const picUrl = getPicUrl(t.partner_pic);

              return (
                <div
                  key={uniqueKey}
                  onClick={() => handleSelectThread(t)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-[#093fb4]/5 border-[#093fb4]/20'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Org Avatar */}
                    <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-[#093fb4]/10 border border-[#093fb4]/10 flex items-center justify-center">
                      {picUrl ? (
                        <img src={picUrl} alt={t.partner_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-[#093fb4]">
                          {t.partner_name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-1">
                        <h4 className={`font-black text-xs uppercase tracking-tight truncate leading-none ${isActive ? 'text-[#093fb4]' : 'text-slate-800'}`}>
                          {t.partner_name}
                        </h4>
                        <span className="text-[9px] font-semibold text-slate-300 whitespace-nowrap shrink-0">
                          {t.updated_at ? new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'New'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-1 leading-none">
                        {t.last_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-white ${!activeThread ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
              <button
                onClick={() => { setActiveThread(null); setThreadStatus(null); }}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-[#093fb4] md:hidden transition-colors shrink-0"
              >
                <ArrowLeft size={14} />
              </button>

              {/* Org Pic */}
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#093fb4]/10 border border-[#093fb4]/10 flex items-center justify-center shrink-0">
                {activeThread.partner_pic ? (
                  <img
                    src={getPicUrl(activeThread.partner_pic)}
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
                <h2 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none truncate">
                  {activeThread.partner_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock size={9} /> Scholar Office Handler
                  </p>
                  {/* Per-thread status pill */}
                  {!statusLoading && threadStatus && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      isEligible
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {threadStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-slate-50/40">
              {loadingMessages ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className={`h-10 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-[#093fb4]/10 w-48' : 'bg-slate-200 w-56'}`} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center pb-10">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-2">
                    <MessageSquare size={16} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">No messages yet</p>
                  <p className="text-[10px] text-slate-300 mt-1">Say hello to get the conversation started!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_type === 'student' && parseInt(msg.sender_id) === studentId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[68%] px-3.5 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-[#093fb4] text-white rounded-br-sm shadow-sm'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-xs'
                      }`}>
                        <p className="font-medium leading-relaxed break-words whitespace-pre-line">
                          {msg.message_text}
                        </p>
                        <p className={`text-[9px] font-semibold mt-1.5 text-right ${isMe ? 'text-white/40' : 'text-slate-300'}`}>
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
              <div className="p-3 border-t border-slate-100 bg-white">
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : isEligible ? (
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#093fb4]/30 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-[#093fb4] text-white rounded-xl hover:bg-[#093fb4]/90 disabled:opacity-30 transition-all shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <Send size={14} strokeWidth={2.5} />
                </button>
              </form>
            ) : (
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert size={13} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-700 uppercase tracking-wide">Messaging Unavailable</p>
                  <p className="text-[11px] text-amber-500 font-medium mt-0.5 leading-snug">
                    Your application with this organization is currently{' '}
                    <span className="font-black capitalize">{threadStatus}</span>.
                    Only approved or renewal scholars can send messages.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="text-center p-8 max-w-xs">
            <div className="w-12 h-12 bg-[#093fb4]/5 border border-[#093fb4]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={20} className="text-[#093fb4]/40" />
            </div>
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-tight">Select a Thread</h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed">
              Pick an organization from the sidebar to view or reply to your scholarship messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}