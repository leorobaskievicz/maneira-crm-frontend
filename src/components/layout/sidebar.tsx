'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Calendar, FileText, DollarSign,
  Package, UserPlus, Settings, Sparkles, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pacientes', icon: Users, label: 'Pacientes' },
  { href: '/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/atendimentos', icon: FileText, label: 'Atendimentos' },
  { href: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/estoque', icon: Package, label: 'Estoque' },
  { href: '/leads', icon: UserPlus, label: 'Leads' },
  { href: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-gradient-to-b from-rose-600 to-rose-700 text-white transition-all duration-300 shadow-xl',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-rose-500', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-lg tracking-tight">Maneira CRM</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname.startsWith(href)
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-rose-100 hover:bg-white/10 hover:text-white',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-rose-500 space-y-1">
        <button onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-100 hover:bg-white/10 hover:text-white transition-all',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-rose-200 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
