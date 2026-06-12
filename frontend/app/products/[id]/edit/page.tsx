// app/products/[id]/edit/page.tsx
// หน้า "/products/:id/edit" — ฟอร์มแก้ไขสินค้า
// Client Component — โหลดข้อมูลเดิม แล้วให้แก้ไข

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);  // ดึง id จาก URL params

  // state — ข้อมูลในฟอร์ม
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');

  // state — สถานะการทำงาน
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect — โหลดข้อมูลสินค้าตอน mount
  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        const product = await getProduct(id);
        // นำข้อมูลเดิมมาใส่ในฟอร์ม
        setName(product.name);
        setDescription(product.description || '');
        setPrice(String(product.price));
        setStock(String(product.stock));
      } catch {
        setError('โหลดข้อมูลสินค้าไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // handleSubmit — เรียก API อัปเดตสินค้า
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await updateProduct(id, {
        name,
        description: description || undefined,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
      });

      // สำเร็จ — กลับหน้ารายการ
      router.push('/products');
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-2">⏳</div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ แก้ไขสินค้า #{id}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อสินค้า *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            คำอธิบาย
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

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
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </form>
    </div>
  );
}
