// app/products/new/page.tsx
// หน้า "/products/new" — ฟอร์มเพิ่มสินค้าใหม่
// Client Component — ใช้ useState จัดการ form

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();

  // state สำหรับแต่ละ field ในฟอร์ม
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // handleSubmit — เรียก API สร้างสินค้า
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();           // ป้องกัน page reload
    setError(null);
    setLoading(true);

    try {
      await createProduct({
        name,
        description: description || undefined,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
      });

      // สำเร็จ — กลับไปหน้ารายการ
      router.push('/products');
    } catch (err: any) {
      setError(err.message || 'เพิ่มสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">➕ เพิ่มสินค้าใหม่</h1>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        {/* ชื่อสินค้า */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อสินค้า *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ผ้าอนามัยแบบเนื้อนุ่ม"
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* คำอธิบาย */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            คำอธิบาย
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* ราคา + สต็อก */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคา (บาท) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full border rounded-lg px-3 py-2 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนสต็อก
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg
                       hover:bg-gray-50 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  );
}
