import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Campus Cleanliness Management System',
  description: 'Automated campus cleanliness monitoring, reporting, and dispatch system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                C
              </span>
              <span className="font-semibold text-lg tracking-tight text-slate-900">
                Campus Cleanliness System
              </span>
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <a href="/login" className="text-slate-600 hover:text-emerald-600 transition">
                Sign In
              </a>
              <a
                href="/register"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition shadow-sm"
              >
                Register
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

