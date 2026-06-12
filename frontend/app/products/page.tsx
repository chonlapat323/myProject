// app/products/page.tsx
// หน้า "/products" — แสดงรายการสินค้าทั้งหมด
// Client Component เพราะต้องใช้ useState + useEffect (CSR)

'use client';

// ============================================================
// Lifecycle ของ Client Component:
//   1. Mount   — Component แสดงครั้งแรก, useEffect ทำงาน
//   2. Render  — แสดง UI (loading → data)
//   3. Update  — state เปลี่ยน (เช่น หลังลบสินค้า) → render ใหม่
//   4. Unmount — ออกจากหน้า
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, deleteProduct, Product } from '@/lib/api';

export default function ProductsPage() {
  // state: เก็บรายการสินค้า
  const [products, setProducts] = useState<Product[]>([]);
  // state: กำลังโหลดอยู่ไหม
  const [loading, setLoading] = useState(true);
  // state: ข้อความ error
  const [error, setError] = useState<string | null>(null);

  // useEffect — โหลดข้อมูลตอน Component Mount ครั้งแรก
  // [] = dependency array ว่าง = ทำงานแค่ครั้งเดียว
  useEffect(() => {
    loadProducts();
  }, []);

  // loadProducts — เรียก API แล้วอัปเดต state
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);         // state เปลี่ยน → render ใหม่
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Backend');
    } finally {
      setLoading(false);
    }
  };

  // handleDelete — ลบสินค้า แล้ว reload list
  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id);
      // กรองสินค้าที่ลบออกจาก state (ไม่ต้อง reload ทั้งหมด)
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  // ============================================================
  // Render States
  // ============================================================

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-2">⏳</div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-2">❌</div>
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadProducts}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายการสินค้า</h1>
          <p className="text-gray-400 text-sm mt-1">
            ทั้งหมด {products.length} รายการ
          </p>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-2">📦</div>
          <p>ยังไม่มีสินค้า</p>
          <Link href="/products/new" className="text-blue-600 hover:underline mt-2 block">
            เพิ่มสินค้าแรก
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
