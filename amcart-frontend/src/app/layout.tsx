import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { AuthProvider } from '@/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-open-sans',
});

export const metadata: Metadata = {
  title: 'AmCart — Fashion E-Commerce',
  description: 'AmCart E-Commerce Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={openSans.variable}>
      <body className="bg-white text-[var(--text)] antialiased font-light">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}