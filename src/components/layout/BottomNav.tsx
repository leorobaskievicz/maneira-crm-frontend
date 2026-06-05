'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { NAV_ITEMS, BOTTOM_NAV_HREFS, getStoredUser, canAccess, type SessionUser } from './nav';

const allTabs = BOTTOM_NAV_HREFS
  .map((href) => NAV_ITEMS.find((i) => i.href === href))
  .filter((i): i is NonNullable<typeof i> => Boolean(i));

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => { setUser(getStoredUser()); }, []);

  const tabs = allTabs.filter((t) => canAccess(user, t.href));
  const current = tabs.findIndex((t) => pathname === t.href || pathname.startsWith(t.href + '/'));

  if (tabs.length === 0) return null;

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
        value={current === -1 ? false : current}
        onChange={(_, v) => router.push(tabs[v].href)}
        sx={{
          height: 62,
          '& .MuiBottomNavigationAction-root': { color: '#BDBDBD', minWidth: 0 },
          '& .MuiBottomNavigationAction-root.Mui-selected': { color: '#A0585A' },
          '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 500 },
        }}
      >
        {tabs.map((t) => (
          <BottomNavigationAction key={t.href} label={t.label} icon={t.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
