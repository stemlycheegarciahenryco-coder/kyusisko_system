import { 
  ShieldCheck, LayoutDashboard, Users, Building2, 
  History, Settings, LogOut, ChevronRight 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { group: "SYSTEM", items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/SuperRootConsole' },
    { name: 'System Admins', icon: ShieldCheck, path: '/super/manage-admins' },
  ]},
  { group: "ENTITIES", items: [
    { name: 'Organizations', icon: Building2, path: '/super/orgs' },
    { name: 'Students', icon: Users, path: '/super/students' },
  ]},
  { group: "LOGS", items: [
    { name: 'Audit Trails', icon: History, path: '/super/audit' },
  ]}
];

export default function SuperSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/rootlogin');
  };

  return (
    <div className="w-72 h-screen bg-slate-900 text-slate-400 p-6 flex flex-col fixed left-0 top-0 border-r border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-white font-black italic tracking-tighter">KYUS<span className="text-blue-500">ISKO</span></h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Super Admin Control</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-8">
        {MENU_ITEMS.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-2">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-sm font-bold">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="pt-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}