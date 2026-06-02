'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

const tabs = [
  { href: '/dashboard', icon: <DashboardOutlinedIcon />, label: 'Início' },
  { href: '/pacientes', icon: <PeopleOutlinedIcon />, label: 'Pacientes' },
  { href: '/agenda', icon: <CalendarTodayOutlinedIcon />, label: 'Agenda' },
  { href: '/financeiro', icon: <AttachMoneyOutlinedIcon />, label: 'Financeiro' },
  { href: '/leads', icon: <PersonAddOutlinedIcon />, label: 'Leads' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const current = tabs.findIndex(t => pathname.startsWith(t.href));

  return (
    <Paper
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid #EDE8E8', zIndex: 1200,
      }}
      elevation={0}
    >
      <BottomNavigation
        value={current}
        onChange={(_, v) => router.push(tabs[v].href)}
        sx={{
          height: 60,
          '& .MuiBottomNavigationAction-root': { color: '#BDBDBD', minWidth: 0 },
          '& .MuiBottomNavigationAction-root.Mui-selected': { color: '#A0585A' },
          '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 500 },
        }}
      >
        {tabs.map(t => (
          <BottomNavigationAction key={t.href} label={t.label} icon={t.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
