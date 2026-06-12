// lib/api.ts
// API Helper — ฟังก์ชันเรียก Backend API ทั้งหมด

// ============================================================
// Type — นิยามรูปแบบข้อมูลสินค้า
// ============================================================
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  stock?: number;
}

// URL ของ Backend อ่านจาก .env.local
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================
// Helper — fetch พร้อม error handling
// ============================================================
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // ถ้า server ตอบ error — โยน Error พร้อมข้อความ
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'เกิดข้อผิดพลาด' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  // 204 No Content — ไม่มี body
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ============================================================
// CRUD Functions
// ============================================================

// GET /api/products — ดึงสินค้าทั้งหมด
export const getProducts = () =>
  fetchApi<Product[]>('/products');

// GET /api/products/:id — ดึงสินค้าตาม id
export const getProduct = (id: number) =>
  fetchApi<Product>(`/products/${id}`);

// POST /api/products — สร้างสินค้าใหม่
export const createProduct = (data: ProductFormData) =>
  fetchApi<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// PUT /api/products/:id — แก้ไขสินค้า
export const updateProduct = (id: number, data: Partial<ProductFormData>) =>
  fetchApi<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// DELETE /api/products/:id — ลบสินค้า
export const deleteProduct = (id: number) =>
  fetchApi<void>(`/products/${id}`, { method: 'DELETE' });
