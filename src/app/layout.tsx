import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'RouteX — Surat City Bus Transit',
  description: 'Real-time schedule, routes, and ticketing for Surat City Bus and BRTS Transit network.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 RouteX Transit. Surat Municipal Corporation & BRTS Network.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Neon PostgreSQL</span>
              <span>•</span>
              <span>Next.js App Router</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Live Transit DB</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
