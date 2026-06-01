'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Calendar, DollarSign, Package, UserPlus } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { href: '/pacientes', icon: Users, label: 'Pacientes' },
  { href: '/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/leads', icon: UserPlus, label: 'Leads' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-rose-100 flex md:hidden safe-bottom">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
              active ? 'text-rose-600' : 'text-gray-400'
            )}
          >
            <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">{label}</span>
            {active && <div className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
          </Link>
        );
      })}
    </nav>
  );
}
