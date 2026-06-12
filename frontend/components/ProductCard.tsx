// components/ProductCard.tsx
// ProductCard — แสดงข้อมูลสินค้า 1 รายการ
// Client Component เพราะมี onClick (event handler)

'use client';

import Link from 'next/link';
import { Product } from '@/lib/api';

interface Props {
  product: Product;
  onDelete: (id: number) => void;  // callback เมื่อกดลบ
}

export default function ProductCard({ product, onDelete }: Props) {
  // handleDelete — ขอยืนยันก่อนลบ
  const handleDelete = () => {
    if (confirm(`ลบ "${product.name}" ใช่ไหม?`)) {
      onDelete(product.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col gap-3">
      {/* ชื่อสินค้า */}
      <h3 className="font-bold text-gray-800 text-lg leading-tight">
        {product.name}
      </h3>

      {/* คำอธิบาย */}
      {product.description && (
        <p className="text-gray-500 text-sm line-clamp-2">
          {product.description}
        </p>
      )}

      {/* ราคา + สต็อก */}
      <div className="flex items-center justify-between">
        <span className="text-blue-600 font-bold text-xl">
          ฿{product.price.toLocaleString()}
        </span>
        <span className={`text-sm px-2 py-0.5 rounded-full ${
          product.stock > 0
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-600'
        }`}>
          {product.stock > 0 ? `สต็อก ${product.stock}` : 'หมด'}
        </span>
      </div>

      {/* ปุ่ม Edit / Delete */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/products/${product.id}/edit`}
          className="flex-1 text-center bg-gray-100 hover:bg-gray-200
                     text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ✏️ แก้ไข
        </Link>
        <button
          onClick={handleDelete}
          className="flex-1 bg-red-50 hover:bg-red-100
                     text-red-600 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          🗑️ ลบ
        </button>
      </div>
    </div>
  );
}
