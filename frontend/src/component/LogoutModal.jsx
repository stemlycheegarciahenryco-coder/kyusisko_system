import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm, role = 'student' }) {
  if (!isOpen) return null;

  // Dynamic subtitle descriptions based on user role
  const getRoleDescription = () => {
    switch (role) {
      case 'student':
        return 'Are you sure you want to sign out? You will need to log in again to check your scholarship applications and updates.';
      case 'provider':
      case 'sub_admin':
        return 'Are you sure you want to sign out? You will need to log in again to manage your scholarship programs and applicants.';
      case 'root_admin':
      case 'co_admin':
      case 'system_admin':
        return 'Are you sure you want to exit KyusISKO? You will need to re-authenticate to view system audit logs and controls.';
      default:
        return 'Are you sure you want to sign out? You will need to log in again to access your portal.';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200 font-['Inter']">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
          <AlertTriangle size={32} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Sign Out?</h2>
        <p className="text-slate-500 font-medium mb-8 text-sm px-4 leading-relaxed">
          {getRoleDescription()}
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm} 
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-xs"
          >
            YES, SIGN OUT
          </button>
          <button 
            onClick={onClose} 
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-xs"
          >
            STAY SIGN IN
          </button>
        </div>
      </div>
    </div>
  );
}