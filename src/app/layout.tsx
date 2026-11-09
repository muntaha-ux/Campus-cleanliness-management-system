import type { Metadata } from 'next';
import './globals.css';
import { BaustHeader } from '@/components/layout/BaustHeader';
import { BaustFooter } from '@/components/layout/BaustFooter';
import { BAUST_INFO } from '@/config/baust-campus';

export const metadata: Metadata = {
  title: `${BAUST_INFO.name} — Cleanliness & Facility Management`,
  description: `Official campus cleanliness monitoring, emergency sanitation dispatch, and cleanliness leaderboard for ${BAUST_INFO.name}, Saidpur Cantonment.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col antialiased">
        <BaustHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <BaustFooter />
      </body>
    </html>
  );
}
