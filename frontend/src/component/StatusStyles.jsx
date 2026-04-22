import { Clock, UserCheck, UserX, ShieldAlert } from 'lucide-react'; // Added ShieldAlert

export const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
  blocked: 'bg-slate-100 text-slate-700 border-slate-300', // Added style
};

export const STATUS_ICONS = {
  pending: <Clock size={12} />,
  approved: <UserCheck size={12} />,
  rejected: <UserX size={12} />,
  blocked: <ShieldAlert size={12} />, // Added icon
};