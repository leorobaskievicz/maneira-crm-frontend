import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import MuiProvider from '@/components/providers/MuiProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Maneira CRM',
  description: 'Sistema de gestão — Clínica Caroline Maneira',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <MuiProvider>
          {children}
        </MuiProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
