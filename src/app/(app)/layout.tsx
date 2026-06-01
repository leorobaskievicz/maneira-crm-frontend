'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — visível só no desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — visível só no mobile */}
      <BottomNav />
    </div>
  );
}
