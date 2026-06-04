'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Typography, InputBase, IconButton, Badge, Avatar, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Tooltip,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { findNavItem } from './nav';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const item = findNavItem(pathname);

  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
  const [addAnchor, setAddAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignora */ }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky', top: 0, zIndex: 1100,
        height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 2,
        px: { xs: 2, md: 3 },
        backgroundColor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #EDE8E8',
      }}
    >
      {/* Título da página */}
      <Box sx={{ minWidth: 0, flexShrink: 1 }}>
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item?.title || item?.label || 'Maneira CRM'}
        </Typography>
        {item?.subtitle && (
          <Typography sx={{ fontSize: '0.72rem', color: '#9A9A9A', lineHeight: 1.2, display: { xs: 'none', sm: 'block' } }}>
            {item.subtitle}
          </Typography>
        )}
      </Box>

      {/* Busca (visual, centralizada) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1,
          ml: 'auto', maxWidth: 340, flex: 1,
          backgroundColor: '#F4F1F1', borderRadius: '10px',
          px: 1.5, py: 0.75, border: '1px solid transparent',
          transition: 'border-color .15s, background-color .15s',
          '&:focus-within': { borderColor: '#D9C7C7', backgroundColor: '#fff' },
        }}
      >
        <SearchOutlinedIcon sx={{ fontSize: 18, color: '#B0A8A8' }} />
        <InputBase placeholder="Buscar paciente, lead, procedimento…" sx={{ fontSize: '0.83rem', flex: 1, color: '#1A1A1A' }} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: { xs: 'auto', md: 0 } }}>
        {/* Atalho rápido */}
        <Tooltip title="Criar">
          <IconButton
            onClick={(e) => setAddAnchor(e.currentTarget)}
            sx={{
              backgroundColor: '#A0585A', color: '#fff', width: 38, height: 38,
              '&:hover': { backgroundColor: '#8F4C4E' },
            }}
          >
            <AddOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={addAnchor} open={Boolean(addAnchor)} onClose={() => setAddAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <MenuItem onClick={() => { setAddAnchor(null); router.push('/agenda'); }}>
            <ListItemIcon><CalendarTodayOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Novo agendamento</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAddAnchor(null); router.push('/leads'); }}>
            <ListItemIcon><PersonAddOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Novo lead</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notificações (placeholder) */}
        <Tooltip title="Notificações">
          <IconButton sx={{ color: '#6B6B6B' }}>
            <Badge variant="dot" color="error" overlap="circular">
              <NotificationsNoneOutlinedIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Usuário */}
        <Tooltip title={user?.name || 'Conta'}>
          <IconButton onClick={(e) => setUserAnchor(e.currentTarget)} sx={{ ml: 0.5, p: 0.25 }}>
            <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 600, bgcolor: '#1A1A1A' }}>{initials}</Avatar>
          </IconButton>
        </Tooltip>
        <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'Usuário'}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#9A9A9A' }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setUserAnchor(null); router.push('/configuracoes'); }}>
            <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Configurações</ListItemText>
          </MenuItem>
          <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Sair</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
