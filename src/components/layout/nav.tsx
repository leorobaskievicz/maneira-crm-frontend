import type { ReactNode } from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';

export interface NavItem {
  href: string;
  label: string;
  /** Texto curto exibido no header da página (default = label) */
  title?: string;
  /** Subtítulo opcional exibido no header da página */
  subtitle?: string;
  icon: ReactNode;
}

export interface NavSection {
  /** Rótulo da seção na sidebar (vazio = sem cabeçalho) */
  heading: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Operacional',
    items: [
      { href: '/dashboard', label: 'Dashboard', subtitle: 'Visão geral da clínica', icon: <DashboardOutlinedIcon fontSize="small" /> },
      { href: '/agenda', label: 'Agenda', subtitle: 'Agendamentos e horários', icon: <CalendarTodayOutlinedIcon fontSize="small" /> },
      { href: '/pacientes', label: 'Pacientes', subtitle: 'Base de pacientes', icon: <PeopleOutlinedIcon fontSize="small" /> },
      { href: '/atendimentos', label: 'Atendimentos', subtitle: 'Prontuários e procedimentos', icon: <AssignmentOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    heading: 'Comercial',
    items: [
      { href: '/leads', label: 'Leads', title: 'Leads', subtitle: 'Funil de prospecção de clientes', icon: <PersonAddOutlinedIcon fontSize="small" /> },
      { href: '/campanhas', label: 'Campanhas', subtitle: 'Landing pages e captação', icon: <CampaignOutlinedIcon fontSize="small" /> },
      { href: '/tarefas', label: 'Tarefas', title: 'Quadros de Tarefas', subtitle: 'Organize projetos e processos internos', icon: <AssignmentTurnedInOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    heading: 'Gestão',
    items: [
      { href: '/financeiro', label: 'Financeiro', subtitle: 'Receitas, despesas e fluxo de caixa', icon: <AttachMoneyOutlinedIcon fontSize="small" /> },
      { href: '/estoque', label: 'Estoque', subtitle: 'Produtos e movimentações', icon: <InventoryOutlinedIcon fontSize="small" /> },
      { href: '/configuracoes', label: 'Configurações', subtitle: 'Preferências do sistema', icon: <SettingsOutlinedIcon fontSize="small" /> },
    ],
  },
];

/** Lista plana de todos os itens (útil para lookups). */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** Itens exibidos na navegação inferior (mobile). */
export const BOTTOM_NAV_HREFS = ['/dashboard', '/agenda', '/pacientes', '/leads', '/tarefas'];

export interface SessionUser { id?: string; name?: string; email?: string; role?: string; permissions?: string[] }

/** Lê o usuário logado do localStorage (client-side). */
export function getStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

/** Admin vê tudo; demais só as rotinas liberadas (por href). */
export function canAccess(user: SessionUser | null, href: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (user.permissions || []).includes(href);
}

/** Seções visíveis para o usuário (remove itens sem permissão e seções vazias). */
export function visibleSections(user: SessionUser | null): NavSection[] {
  if (user?.role === 'admin') return NAV_SECTIONS;
  return NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => canAccess(user, i.href)) }))
    .filter((s) => s.items.length > 0);
}

/** Primeira rotina que o usuário pode acessar (para redirecionar). */
export function firstAllowedHref(user: SessionUser | null): string | null {
  if (user?.role === 'admin') return '/dashboard';
  const item = NAV_ITEMS.find((i) => canAccess(user, i.href));
  return item?.href ?? null;
}

/** Resolve o item de navegação correspondente a um pathname. */
export function findNavItem(pathname: string): NavItem | undefined {
  // match mais específico primeiro (maior href que casa com o início do path)
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
}
