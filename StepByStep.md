# Step-by-Step Guide — สร้าง Full Stack App จาก 0

สร้างแอป CRUD สินค้า ด้วย Next.js + NestJS + PostgreSQL (Docker)  
ทำตามทีละขั้น จะได้แอปที่ใช้งานได้จริงเหมือนตัวอย่าง

---

## สิ่งที่ต้องมีก่อนเริ่ม

| เครื่องมือ | ตรวจสอบด้วย |
|---|---|
| Node.js v18+ | `node -v` |
| npm | `npm -v` |
| Docker Desktop (เปิดทิ้งไว้) | `docker -v` |
| Git | `git -v` |

---

## ภาพรวมโครงสร้างที่จะสร้าง

```
myProject/
├── docker-compose.yml        ← ไฟล์รัน Database
├── backend/                  ← NestJS API Server
│   ├── prisma/schema.prisma  ← โครงสร้างตาราง DB
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/           ← เชื่อมต่อ Database
│   │   └── products/         ← CRUD API
│   └── .env
└── frontend/                 ← Next.js Web App
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── products/         ← หน้าจัดการสินค้า
    ├── components/
    ├── lib/api.ts
    └── .env.local
```

---

## ขั้นตอนที่ 1 — สร้างโฟลเดอร์โปรเจกต์

```bash
mkdir myProject
cd myProject
```

---

## ขั้นตอนที่ 2 — ตั้งค่า Database ด้วย Docker

### 2.1 สร้างไฟล์ `docker-compose.yml`

สร้างไฟล์ `docker-compose.yml` ที่ root ของโปรเจกต์:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: fullstack_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fullstack_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fullstack_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: fullstack_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - fullstack_network

volumes:
  postgres_data:

networks:
  fullstack_network:
    driver: bridge
```

### 2.2 รัน Database

```bash
docker compose up -d postgres
```

ตรวจสอบว่ารันสำเร็จ (ควรเห็น `0.0.0.0:5432->5432/tcp`):

```bash
docker ps
```

---

## ขั้นตอนที่ 3 — สร้าง Backend ด้วย NestJS CLI

### 3.1 ติดตั้ง NestJS CLI (ถ้ายังไม่มี)

```bash
npm install -g @nestjs/cli
```

### 3.2 สร้างโปรเจกต์ NestJS

```bash
nest new backend --skip-git
```

> เลือก `npm` เมื่อถามเรื่อง package manager

### 3.3 เข้าโฟลเดอร์ backend และติดตั้ง packages เพิ่มเติม

```bash
cd backend
npm install @nestjs/config @prisma/client prisma class-validator class-transformer
```

### 3.4 ลบไฟล์ตัวอย่างที่ NestJS สร้างให้ (ไม่ใช้)

```bash
# Windows
del src\app.controller.ts src\app.controller.spec.ts src\app.service.ts

# macOS / Linux
rm src/app.controller.ts src/app.controller.spec.ts src/app.service.ts
```

---

## ขั้นตอนที่ 4 — ตั้งค่า Prisma (Database ORM)

### 4.1 สร้างไฟล์ Prisma

```bash
npx prisma init
```

คำสั่งนี้จะสร้าง:
- `prisma/schema.prisma` — นิยามโครงสร้าง DB
- `.env` — ไฟล์ตัวแปร environment

### 4.2 แก้ไข `prisma/schema.prisma`

แทนที่เนื้อหาทั้งหมดด้วย:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

### 4.3 แก้ไข `.env`

แทนที่เนื้อหาด้วย:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fullstack_db?schema=public"
PORT=3001
```

### 4.4 สร้างตารางใน Database

```bash
npx prisma db push
```

ผลที่ควรเห็น: `Your database is now in sync with your Prisma schema`

### 4.5 สร้าง Prisma Client

```bash
npx prisma generate
```

---

## ขั้นตอนที่ 5 — เขียน Code Backend

### 5.1 แก้ไข `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
  ],
})
export class AppModule {}
```

### 5.2 แก้ไข `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`✅ Backend รันอยู่ที่ http://localhost:${port}/api`);
}

bootstrap();
```

### 5.3 สร้าง PrismaModule และ PrismaService

สร้างโฟลเดอร์และไฟล์:

```bash
# Windows
mkdir src\prisma

# macOS / Linux
mkdir -p src/prisma
```

**`src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**`src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('✅ เชื่อมต่อ Database สำเร็จ');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 5.4 สร้าง Products Module ด้วย CLI

```bash
nest generate module products
nest generate controller products --no-spec
nest generate service products --no-spec
```

คำสั่งนี้สร้าง:
- `src/products/products.module.ts`
- `src/products/products.controller.ts`
- `src/products/products.service.ts`

และ NestJS จะ import ProductsModule เข้า AppModule ให้อัตโนมัติ

### 5.5 สร้าง DTO (Data Transfer Object)

```bash
# Windows
mkdir src\products\dto

# macOS / Linux
mkdir -p src/products/dto
```

**`src/products/dto/create-product.dto.ts`**

```typescript
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
```

**`src/products/dto/update-product.dto.ts`**

```typescript
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
```

### 5.6 แทนที่ `src/products/products.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`ไม่พบสินค้า id: ${id}`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
```

### 5.7 แทนที่ `src/products/products.controller.ts`

```typescript
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
```

### 5.8 แทนที่ `src/products/products.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

### 5.9 ทดสอบรัน Backend

```bash
npm run start:dev
```

ผลที่ควรเห็น:
```
✅ เชื่อมต่อ Database สำเร็จ
✅ Backend รันอยู่ที่ http://localhost:3001/api
```

ทดสอบ API:
```bash
curl http://localhost:3001/api/products
# ควรได้ []
```

---

## ขั้นตอนที่ 6 — สร้าง Frontend ด้วย Next.js CLI

เปิด Terminal ใหม่ (backend ปล่อยให้รันอยู่)

### 6.1 สร้างโปรเจกต์ Next.js

กลับไปที่ root ของโปรเจกต์ก่อน:

```bash
cd ..   # กลับจาก backend ไป myProject
```

จากนั้นรัน:

```bash
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

> เมื่อถามตอบตามนี้:
> - TypeScript: **Yes**
> - ESLint: **Yes**
> - Tailwind CSS: **Yes**
> - `src/` directory: **No**
> - App Router: **Yes**
> - Import alias: **Yes** (ใช้ค่าเริ่มต้น `@/*`)

### 6.2 เข้าโฟลเดอร์ frontend

```bash
cd frontend
```

---

## ขั้นตอนที่ 7 — ตั้งค่า Environment และ Config Frontend

### 7.1 สร้างไฟล์ `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 7.2 ลบไฟล์ตัวอย่างที่ Next.js สร้างให้

```bash
# Windows
del app\page.tsx app\globals.css

# macOS / Linux
rm app/page.tsx app/globals.css
```

---

## ขั้นตอนที่ 8 — เขียน Code Frontend

### 8.1 สร้าง `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 8.2 แทนที่ `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Full Stack Demo',
  description: 'Next.js + NestJS + PostgreSQL CRUD App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

### 8.3 สร้าง `app/page.tsx`

```typescript
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
      <p className="text-gray-400 mb-8">ตัวอย่างแอป CRUD สินค้าพื้นฐาน</p>

      <Link
        href="/products"
        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg
                   text-lg font-medium hover:bg-blue-700 transition-colors"
      >
        ดูรายการสินค้า →
      </Link>

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
```

### 8.4 สร้าง `lib/api.ts`

```bash
# Windows
mkdir lib

# macOS / Linux
mkdir -p lib
```

**`lib/api.ts`**

```typescript
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'เกิดข้อผิดพลาด' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const getProducts = () => fetchApi<Product[]>('/products');
export const getProduct = (id: number) => fetchApi<Product>(`/products/${id}`);

export const createProduct = (data: ProductFormData) =>
  fetchApi<Product>('/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id: number, data: Partial<ProductFormData>) =>
  fetchApi<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProduct = (id: number) =>
  fetchApi<void>(`/products/${id}`, { method: 'DELETE' });
```

### 8.5 สร้าง Components

```bash
# Windows
mkdir components

# macOS / Linux
mkdir -p components
```

**`components/Navbar.tsx`**

```typescript
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          🛍️ Full Stack Demo
        </Link>
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
```

**`components/ProductCard.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { Product } from '@/lib/api';

interface Props {
  product: Product;
  onDelete: (id: number) => void;
}

export default function ProductCard({ product, onDelete }: Props) {
  const handleDelete = () => {
    if (confirm(`ลบ "${product.name}" ใช่ไหม?`)) {
      onDelete(product.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col gap-3">
      <h3 className="font-bold text-gray-800 text-lg leading-tight">
        {product.name}
      </h3>

      {product.description && (
        <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-blue-600 font-bold text-xl">
          ฿{product.price.toLocaleString()}
        </span>
        <span className={`text-sm px-2 py-0.5 rounded-full ${
          product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {product.stock > 0 ? `สต็อก ${product.stock}` : 'หมด'}
        </span>
      </div>

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
```

### 8.6 สร้างหน้า Products

สร้างโฟลเดอร์ตามโครงสร้าง:

```bash
# Windows
mkdir app\products
mkdir app\products\new
mkdir app\products\[id]
mkdir app\products\[id]\edit

# macOS / Linux
mkdir -p app/products/new app/products/\[id\]/edit
```

**`app/products/page.tsx`** — หน้าแสดงรายการสินค้า

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, deleteProduct, Product } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Backend');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('ลบไม่สำเร็จ กรุณาลองใหม่');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายการสินค้า</h1>
          <p className="text-gray-400 text-sm mt-1">ทั้งหมด {products.length} รายการ</p>
        </div>
      </div>

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
            <ProductCard key={product.id} product={product} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**`app/products/new/page.tsx`** — หน้าเพิ่มสินค้า

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createProduct({
        name,
        description: description || undefined,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
      });
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า *</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="เช่น สินค้าตัวอย่าง"
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท) *</label>
            <input
              type="number" required min="0" step="0.01" value={price}
              onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
              className="w-full border rounded-lg px-3 py-2 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนสต็อก</label>
            <input
              type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg
                       hover:bg-gray-50 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="submit" disabled={loading}
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
```

**`app/products/[id]/edit/page.tsx`** — หน้าแก้ไขสินค้า

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        const product = await getProduct(id);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า *</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท) *</label>
            <input
              type="number" required min="0" step="0.01" value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนสต็อก</label>
            <input
              type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg
                       hover:bg-gray-50 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="submit" disabled={saving}
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
```

### 8.7 รัน Frontend

```bash
npm run dev
```

เปิด browser ที่ `http://localhost:3000`

---

## สรุปขั้นตอนทั้งหมด

```
1. mkdir myProject && cd myProject
2. สร้าง docker-compose.yml → docker compose up -d postgres
3. nest new backend --skip-git → ติดตั้ง packages
4. npx prisma init → แก้ schema → npx prisma db push
5. เขียน code: PrismaModule, PrismaService, ProductsModule
6. npx create-next-app@14 frontend → ตั้งค่า .env.local
7. เขียน code: layout, pages, components, lib/api.ts
8. รัน: npm run start:dev (backend) + npm run dev (frontend)
```

## ตรวจสอบว่าทำงานถูกต้อง

| ทดสอบ | ผลที่ควรได้ |
|---|---|
| `http://localhost:3000` | เห็นหน้า Home |
| `http://localhost:3000/products` | เห็นหน้ารายการสินค้า |
| กดปุ่ม "+ เพิ่มสินค้า" | เปิดฟอร์มเพิ่มสินค้า |
| เพิ่มสินค้า แล้ว submit | สินค้าปรากฏในรายการ |
| กดแก้ไข / ลบ | ข้อมูลเปลี่ยนตามทันที |
| `http://localhost:3001/api/products` | ได้ JSON array ของสินค้า |
