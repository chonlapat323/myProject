// app/page.tsx
// หน้าแรก "/" — Server Component (SSR)
// Next.js render หน้านี้ฝั่ง Server ก่อนส่ง HTML ให้ client

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        🛍️ Full Stack Demo
      </h1>
      <p className="text-gray-500 text-lg mb-2">
        Next.js + NestJS + PostgreSQL + Docker
      </p>
      <p className="text-gray-400 mb-8">
        ตัวอย่างแอป CRUD สินค้าพื้นฐาน
      </p>

      <Link
        href="/products"
        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg
                   text-lg font-medium hover:bg-blue-700 transition-colors"
      >
        ดูรายการสินค้า →
      </Link>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-3 gap-4 mt-16 text-left">
        {[
          { icon: '⚛️', title: 'Next.js 14', desc: 'App Router, SSR, CSR' },
          { icon: '🦁', title: 'NestJS 10', desc: 'Module/Controller/Service' },
          { icon: '🐘', title: 'PostgreSQL', desc: 'via Docker + Prisma ORM' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-bold text-gray-800">{item.title}</h3>
            <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
