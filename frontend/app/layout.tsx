// app/layout.tsx
// Root Layout — ครอบทุกหน้า, โหลดครั้งเดียว (Server Component)
// Lifecycle: render ฝั่ง Server → ส่ง HTML ให้ browser

import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

// metadata — กำหนด <title> และ <meta description> ของ site
export const metadata: Metadata = {
  title: 'Full Stack Demo',
  description: 'Next.js + NestJS + PostgreSQL CRUD App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">
        {/* Navbar แสดงทุกหน้า */}
        <Navbar />

        {/* children = หน้าปัจจุบัน */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
