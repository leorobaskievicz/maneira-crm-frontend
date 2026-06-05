'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { getStoredUser, findNavItem, canAccess, firstAllowedHref } from '@/components/layout/nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
      return;
    }
    const user = getStoredUser();
    const item = findNavItem(pathname);
    // Rotina conhecida e usuário sem permissão → redireciona ou bloqueia
    if (user && user.role !== 'admin' && item && !canAccess(user, item.href)) {
      const target = firstAllowedHref(user);
      if (target && target !== item.href) { router.replace(target); return; }
      setDenied(true); setReady(true); return;
    }
    setDenied(false);
    setReady(true);
  }, [router, pathname]);

  if (!ready) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F5' }}>
      <CircularProgress size={32} sx={{ color: '#A0585A' }} />
    </Box>
  );

  if (denied) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F5', textAlign: 'center', p: 3 }}>
      <LockOutlinedIcon sx={{ fontSize: 48, color: '#C9BFBF', mb: 1.5 }} />
      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Sem acesso liberado</Typography>
      <Typography variant="body2" sx={{ color: '#9A9A9A', mt: 0.5, maxWidth: 360 }}>
        Seu usuário ainda não tem permissão para nenhuma rotina. Peça a um administrador para liberar o acesso.
      </Typography>
      <Button variant="outlined" sx={{ mt: 3, borderColor: '#EDE8E8', color: '#6B6B6B' }}
        onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.replace('/login'); }}>
        Sair
      </Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F7F5F5', overflow: 'hidden' }}>
      {/* Sidebar — desktop only */}
      <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Sidebar />
      </Box>

      {/* Coluna principal */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Topbar />
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            pb: { xs: 9, md: 0 },
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': { background: '#DDD', borderRadius: 4 },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Navegação inferior — mobile only */}
      <BottomNav />
    </Box>
  );
}
