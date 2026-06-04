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

/** Resolve o item de navegação correspondente a um pathname. */
export function findNavItem(pathname: string): NavItem | undefined {
  // match mais específico primeiro (maior href que casa com o início do path)
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
}
