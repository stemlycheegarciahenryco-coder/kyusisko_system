import React, { useState, useEffect } from 'react';
import api from '../api';
import { Bell, BellOff, X, FileUp, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2
import RenewalCard from '../RenewalCard';

export default function StudentNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/renew/notifications/student'); 
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const openRenewalModal = (notif) => {
    setSelectedNotif(notif);
    setIsModalOpen(true);
  };

  const closeRenewalModal = () => {
    setIsModalOpen(false);
    setSelectedNotif(null);
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Loading Notifications...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-black mb-8 tracking-tight">Notifications</h2>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <BellOff className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No notifications yet!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notifications.map((notif) => {
            const isRenewal = notif.title === "Recommence Application Required";
            // Check if already submitted using the app_status from your controller's JOIN
            const isSubmitted = notif.app_status === 'renewal_under_review' || notif.app_status === 'approved';

            return (
              <div
                key={notif.id}
                className={`p-8 rounded-[2.5rem] border-2 transition-all ${
                  notif.is_read ? 'bg-white border-slate-100 shadow-sm' : 'bg-blue-50 border-blue-100 shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className={`font-black uppercase tracking-tight ${isRenewal ? 'text-blue-600' : 'text-slate-900'}`}>
                      {notif.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.is_read && <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-200"></div>}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    {new Date(notif.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>

                  {/* CONDITIONAL ACTION BUTTON OR TAG */}
                  {isRenewal && (
                    isSubmitted ? (
                      /* SHOW THIS IF ALREADY SUBMITTED */
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <CheckCircle2 size={14} /> Requirements Submitted
                      </div>
                    ) : (
                      /* SHOW THIS IF NOT YET SUBMITTED */
                      <button
                        onClick={() => openRenewalModal(notif)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100"
                      >
                        <FileUp size={14} /> Submit Requirements
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- RENEWAL MODAL OVERLAY --- */}
      {isModalOpen && selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Bell size={20} />
                </div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-tight">Requirement Submission</h3>
              </div>
              <button onClick={closeRenewalModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-2 overflow-y-auto max-h-[80vh]">
              <RenewalCard
                appId={selectedNotif.application_id}
                term="2nd Semester" 
                sy="2025-2026"     
                onComplete={() => {
                  fetchNotifications(); // Refresh list to trigger 'isSubmitted' logic
                  closeRenewalModal();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}