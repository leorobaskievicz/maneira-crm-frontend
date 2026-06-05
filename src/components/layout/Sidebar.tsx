'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { findNavItem, getStoredUser, visibleSections, type SessionUser } from './nav';

export const DRAWER_WIDTH = 248;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = findNavItem(pathname)?.href;
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => { setUser(getStoredUser()); }, []);
  const sections = visibleSections(user);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <Box
      component="aside"
      sx={{
        width: DRAWER_WIDTH,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        backgroundColor: '#161616',
        backgroundImage: 'linear-gradient(180deg, #1E1E1E 0%, #141414 100%)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #262626',
      }}
    >
      {/* Marca */}
      <Box sx={{ px: 2.5, py: 2.75, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, #C4807F 0%, #A0585A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(160,88,90,0.4)',
          }}
        >
          <AutoAwesomeOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.2 }}>
            Maneira CRM
          </Typography>
          <Typography sx={{ color: '#7A7A7A', fontSize: '0.68rem', letterSpacing: '0.02em' }}>
            Clínica Caroline
          </Typography>
        </Box>
      </Box>

      {/* Navegação agrupada */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: '#333', borderRadius: 2 } }}>
        {sections.map((section) => (
          <Box key={section.heading} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                px: 1.5, mb: 0.5, color: '#5C5C5C', fontSize: '0.62rem',
                fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              {section.heading}
            </Typography>
            <List disablePadding>
              {section.items.map(({ href, icon, label }) => {
                const active = activeHref === href;
                return (
                  <ListItemButton
                    key={href}
                    onClick={() => router.push(href)}
                    disableRipple
                    sx={{
                      position: 'relative',
                      borderRadius: '8px',
                      mb: 0.25,
                      py: 0.85,
                      pl: 1.5,
                      transition: 'background-color .15s, color .15s',
                      backgroundColor: active ? 'rgba(160,88,90,0.16)' : 'transparent',
                      '&:hover': { backgroundColor: active ? 'rgba(160,88,90,0.22)' : 'rgba(255,255,255,0.05)' },
                      '&::before': active
                        ? { content: '""', position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 3, backgroundColor: '#C4807F' }
                        : {},
                      '& .MuiListItemIcon-root': { color: active ? '#E0A9A8' : '#777', minWidth: 32 },
                      '& .MuiListItemText-primary': {
                        fontSize: '0.83rem',
                        fontWeight: active ? 600 : 500,
                        color: active ? '#fff' : '#A8A8A8',
                      },
                    }}
                  >
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText primary={label} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Rodapé / sair */}
      <Box sx={{ p: 1.25, borderTop: '1px solid #262626' }}>
        <ListItemButton
          onClick={logout}
          disableRipple
          sx={{
            borderRadius: '8px', py: 0.85, pl: 1.5,
            '& .MuiListItemIcon-root': { color: '#666', minWidth: 32 },
            '& .MuiListItemText-primary': { fontSize: '0.83rem', color: '#888', fontWeight: 500 },
            '&:hover': { backgroundColor: 'rgba(211,47,47,0.12)', '& .MuiListItemIcon-root, & .MuiListItemText-primary': { color: '#E57373' } },
          }}
        >
          <ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </Box>
    </Box>
  );
}
