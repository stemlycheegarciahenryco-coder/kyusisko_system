import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Form,
  Bell,  
  LucideScroll,
  LogOut,
  User
  
} from 'lucide-react';

export default function OrgSidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/OrgDashboard' },
    // CHANGED: These now point to "Selector" pages instead of specific IDs
    { name: 'Applicants', icon: <Form size={20} />, path: '/SelectScholarship/applicants' }, 
    { name: 'Scholarship Fields', icon: <LucideScroll size={20} />, path: '/ScholarFields' }, 
    
    { name: 'Notification', icon: <Bell size={20} />, path: '/OrgNotif' },
    { name: 'Profile', icon: <User size={20} />, path: '/OrgProfile' },
  ];

  return (  
    <div className="h-screen w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 rounded-r-2xl shadow-lg">
      <div className="p-6 mb-4">
        <h1 className="text-2xl font-black text-white italic tracking-tighter">KyusISKO</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'hover:bg-slate-900 hover:text-white text-slate-400'}
            `}
          >
            <span className="transition-colors group-hover:text-blue-400">
              {item.icon}
            </span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-900">
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}