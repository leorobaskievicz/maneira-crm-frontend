'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F5' }}>
      <CircularProgress size={32} sx={{ color: '#A0585A' }} />
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
