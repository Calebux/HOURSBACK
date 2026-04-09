import { Link, useLocation } from 'react-router-dom';
import { Bot, FileText, User, Search } from 'lucide-react';

export function MobileNav() {
  const { pathname } = useLocation();

  const links = [
    { to: '/workflows', icon: Bot, label: 'Workflows', exact: true },
    { to: '/workflows/new', icon: Search, label: 'Browse', exact: false },
    { to: '/reports', icon: FileText, label: 'Reports', exact: true },
    { to: '/account', icon: User, label: 'Account', exact: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex md:hidden z-50 safe-area-pb">
      {links.map(({ to, icon: Icon, label, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active ? 'text-[#DA7756]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
