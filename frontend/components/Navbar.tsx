// components/Navbar.tsx
// Navbar Component — แสดงทุกหน้า (ถูกเรียกจาก layout.tsx)
// Server Component — ไม่ใช้ useState/useEffect

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          🛍️ Full Stack Demo
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-6">
          <Link
            href="/products"
            className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            สินค้า
          </Link>
          <Link
            href="/products/new"
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg
                       hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + เพิ่มสินค้า
          </Link>
        </div>
      </div>
    </nav>
  );
}
