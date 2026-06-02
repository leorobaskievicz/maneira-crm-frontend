'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, IconButton, Tooltip, Avatar,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

const DRAWER_WIDTH = 224;

const navItems = [
  { href: '/dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, label: 'Dashboard' },
  { href: '/pacientes', icon: <PeopleOutlinedIcon fontSize="small" />, label: 'Pacientes' },
  { href: '/agenda', icon: <CalendarTodayOutlinedIcon fontSize="small" />, label: 'Agenda' },
  { href: '/atendimentos', icon: <AssignmentOutlinedIcon fontSize="small" />, label: 'Atendimentos' },
  { href: '/financeiro', icon: <AttachMoneyOutlinedIcon fontSize="small" />, label: 'Financeiro' },
  { href: '/estoque', icon: <InventoryOutlinedIcon fontSize="small" />, label: 'Estoque' },
  { href: '/leads', icon: <PersonAddOutlinedIcon fontSize="small" />, label: 'Leads' },
  { href: '/campanhas', icon: <CampaignOutlinedIcon fontSize="small" />, label: 'Campanhas' },
  { href: '/configuracoes', icon: <SettingsOutlinedIcon fontSize="small" />, label: 'Configurações' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#1A1A1A',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '6px',
          backgroundColor: '#A0585A',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AutoAwesomeOutlinedIcon sx={{ color: '#fff', fontSize: 16 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.2 }}>
            Maneira CRM
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
            Clínica Caroline
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#2A2A2A', mx: 2 }} />

      {/* Nav */}
      <List sx={{ flex: 1, py: 1.5, px: 0.5 }}>
        {navItems.map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <ListItem key={href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={active}
                onClick={() => router.push(href)}
                sx={{
                  borderRadius: '4px',
                  mx: 0.5,
                  py: 0.9,
                  '& .MuiListItemIcon-root': { color: active ? '#fff' : '#666', minWidth: 34 },
                  '& .MuiListItemText-primary': {
                    fontSize: '0.82rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : '#999',
                  },
                }}
              >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#2A2A2A', mx: 2 }} />

      {/* Footer */}
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: '4px',
            py: 0.9,
            '& .MuiListItemIcon-root': { color: '#555', minWidth: 34 },
            '& .MuiListItemText-primary': { fontSize: '0.82rem', color: '#777' },
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
          }}
        >
          <ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
