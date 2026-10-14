import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EV CYBER-LABS | EV CYBER ACADEMY',
  description: 'Browser-based Virtual Linux and Cybersecurity Learning Environment for LFHP Students.',
  keywords: ['EV Cyber Academy', 'EV Cyber-Labs', 'LFHP', 'Linux Desktop', 'Cybersecurity Labs', 'Learn Hacking'],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased overflow-hidden bg-[#040812] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
