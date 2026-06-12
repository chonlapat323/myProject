# Full Stack Demo — Next.js + NestJS + PostgreSQL

ตัวอย่างแอป CRUD สินค้า สำหรับการเรียนรู้ Full Stack Development

## สิ่งที่ต้องติดตั้งก่อนเริ่ม

### 1. Node.js (v18 ขึ้นไป แนะนำ v20+)

ดาวน์โหลดได้จาก https://nodejs.org

ตรวจสอบเวอร์ชันที่ติดตั้ง:
```bash
node -v   # ควรได้ v18.x.x ขึ้นไป
npm -v    # ควรได้ v9.x.x ขึ้นไป
```

### 2. Docker Desktop

ใช้สำหรับรัน PostgreSQL (ฐานข้อมูล) โดยไม่ต้องติดตั้งเพิ่มในเครื่อง

ดาวน์โหลดได้จาก https://www.docker.com/products/docker-desktop

ตรวจสอบหลังติดตั้ง:
```bash
docker -v           # ควรได้ Docker version 24.x ขึ้นไป
docker compose version  # ควรได้ Docker Compose version 2.x ขึ้นไป
```

> **หมายเหตุ:** ต้องเปิด Docker Desktop ทิ้งไว้ก่อนรันโปรเจกต์ทุกครั้ง

### 3. Git

ใช้สำหรับ clone โปรเจกต์

ดาวน์โหลดได้จาก https://git-scm.com

ตรวจสอบ:
```bash
git -v
```

### 4. Code Editor (แนะนำ VS Code)

ดาวน์โหลดได้จาก https://code.visualstudio.com

Extensions ที่แนะนำ:
- **Prisma** — syntax highlighting สำหรับ schema.prisma
- **Tailwind CSS IntelliSense** — autocomplete สำหรับ Tailwind
- **ESLint** — ช่วยตรวจ code

---

## โครงสร้างโปรเจกต์

```
myProject/
├── docker-compose.yml     # PostgreSQL + pgAdmin
├── backend/               # NestJS + Prisma
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   └── products/
│   │       ├── dto/
│   │       │   ├── create-product.dto.ts
│   │       │   └── update-product.dto.ts
│   │       ├── products.controller.ts
│   │       ├── products.service.ts
│   │       └── products.module.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/              # Next.js + Tailwind CSS
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── products/
    │       ├── page.tsx
    │       ├── new/page.tsx
    │       └── [id]/edit/page.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   └── ProductCard.tsx
    ├── lib/
    │   └── api.ts
    ├── package.json
    └── .env.local.example
```

---

## วิธีรันโปรเจกต์

### ขั้นตอนที่ 1 — Clone โปรเจกต์

```bash
git clone https://github.com/chonlapat323/myProject.git
cd myProject
```

### ขั้นตอนที่ 2 — เริ่ม Database ด้วย Docker

> ตรวจสอบให้แน่ใจว่า Docker Desktop เปิดอยู่ก่อน

```bash
docker compose up -d postgres
```

- PostgreSQL: `localhost:5432`
- pgAdmin UI (ถ้ารัน): `http://localhost:5050` (email: `admin@admin.com` / password: `admin`)

### ขั้นตอนที่ 3 — Setup Backend

```bash
cd backend

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env จาก example
cp .env.example .env        # macOS / Linux
copy .env.example .env      # Windows

# สร้างตารางใน Database
npx prisma db push

# รัน Backend (development mode พร้อม auto-reload)
npm run start:dev
```

Backend รันที่: `http://localhost:3001/api`

### ขั้นตอนที่ 4 — Setup Frontend

เปิด terminal ใหม่อีกหน้าต่าง

```bash
cd frontend

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env.local จาก example
cp .env.local.example .env.local        # macOS / Linux
copy .env.local.example .env.local      # Windows

# รัน Frontend
npm run dev
```

Frontend รันที่: `http://localhost:3000`

---

## API Endpoints

| Method | Path                | คำอธิบาย         |
|--------|---------------------|------------------|
| GET    | /api/products       | ดึงสินค้าทั้งหมด |
| GET    | /api/products/:id   | ดึงสินค้าตาม id  |
| POST   | /api/products       | สร้างสินค้าใหม่  |
| PUT    | /api/products/:id   | แก้ไขสินค้า      |
| DELETE | /api/products/:id   | ลบสินค้า         |

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| Backend | NestJS 10, Prisma ORM, TypeScript |
| Database | PostgreSQL 16 (via Docker) |
| Dev Tools | pgAdmin 4, Docker Compose |
