# Step-by-Step Guide — สร้าง Full Stack App จาก 0

สร้างแอป CRUD สินค้า ด้วย Next.js + NestJS + PostgreSQL (Docker)  
ทำตามทีละขั้น จะได้แอปที่ใช้งานได้จริงเหมือนตัวอย่าง

---

## สิ่งที่ต้องมีก่อนเริ่ม

| เครื่องมือ | ตรวจสอบด้วย | ใช้ทำอะไร |
|---|---|---|
| Node.js v18+ | `node -v` | รัน JavaScript บนเครื่อง |
| npm | `npm -v` | ติดตั้ง package ต่างๆ |
| Docker Desktop (เปิดทิ้งไว้) | `docker -v` | รัน PostgreSQL แบบไม่ต้องติดตั้ง |
| Git | `git -v` | จัดการ version ของ code |

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

**การไหลของข้อมูลในระบบ:**

```
Browser → Next.js → fetch() → NestJS Controller → Service → Prisma → PostgreSQL
        ←          ←          ←                  ←          ←        ←
```

---

## ขั้นตอนที่ 1 — สร้างโฟลเดอร์โปรเจกต์

```bash
mkdir myProject
cd myProject
```

> **ทำไม:** ต้องมี root folder ครอบทั้ง backend และ frontend ไว้ด้วยกัน
> เพื่อให้ `docker-compose.yml` อยู่ตรงกลาง และจัดการ git ได้จากที่เดียว

---

## ขั้นตอนที่ 2 — ตั้งค่า Database ด้วย Docker

### 2.1 สร้างไฟล์ `docker-compose.yml`

สร้างไฟล์ `docker-compose.yml` ที่ root ของโปรเจกต์:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine       # ใช้ PostgreSQL version 16 (alpine = ขนาดเล็ก)
    container_name: fullstack_postgres
    restart: unless-stopped         # restart อัตโนมัติถ้า crash (ยกเว้นกด stop เอง)
    environment:
      POSTGRES_USER: postgres       # ชื่อ user สำหรับเข้า DB
      POSTGRES_PASSWORD: postgres   # รหัสผ่าน
      POSTGRES_DB: fullstack_db     # ชื่อ database ที่จะสร้างให้อัตโนมัติ
    ports:
      - "5432:5432"                 # เปิด port 5432 ให้เครื่องเราเข้าถึง DB ได้
    volumes:
      - postgres_data:/var/lib/postgresql/data  # เก็บข้อมูลถาวร (ไม่หายตอน restart)
    networks:
      - fullstack_network

  pgadmin:
    image: dpage/pgadmin4:latest    # UI สำหรับดูข้อมูลใน DB ผ่าน browser
    container_name: fullstack_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"                   # เข้าใช้งานที่ http://localhost:5050
    depends_on:
      - postgres                    # รอให้ postgres พร้อมก่อนค่อยเริ่ม
    networks:
      - fullstack_network

volumes:
  postgres_data:                    # named volume = ข้อมูลอยู่คงทนแม้ container ถูกลบ

networks:
  fullstack_network:
    driver: bridge                  # ให้ postgres กับ pgadmin คุยกันได้
```

> **ทำไมใช้ Docker:** ไม่ต้องติดตั้ง PostgreSQL จริงบนเครื่อง
> ทุกคนในทีมใช้ version เดียวกัน และลบ container ทิ้งได้โดยไม่กระทบเครื่อง

### 2.2 รัน Database

```bash
docker compose up -d postgres
```

> **`-d`** = detach คือรันอยู่ background ไม่ยึด terminal
> ระบุชื่อ service `postgres` เพื่อไม่ให้ pgadmin รันด้วย (ประหยัด resource)

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

> **`-g`** = global ติดตั้งไว้ใช้ได้ทุกโปรเจกต์บนเครื่อง
> CLI นี้ให้คำสั่ง `nest` สำหรับสร้าง project และ generate ไฟล์ต่างๆ

### 3.2 สร้างโปรเจกต์ NestJS

```bash
nest new backend --skip-git
```

> **`--skip-git`** = ไม่สร้าง `.git` ใน backend เพราะเราจัดการ git ที่ root แทน
> คำสั่งนี้สร้างโครงสร้างไฟล์ทั้งหมดให้พร้อมใช้งาน

เลือก `npm` เมื่อถามเรื่อง package manager

### 3.3 เข้าโฟลเดอร์ backend และติดตั้ง packages เพิ่มเติม

```bash
cd backend
npm install @nestjs/config @prisma/client prisma class-validator class-transformer
```

| Package | หน้าที่ |
|---|---|
| `@nestjs/config` | อ่านค่าจากไฟล์ `.env` เพื่อนำมาใช้ใน code |
| `@prisma/client` | ตัว ORM ที่ใช้คุยกับ Database แทนการเขียน SQL |
| `prisma` | CLI tool สำหรับ `db push`, `generate`, `migrate` |
| `class-validator` | ตรวจข้อมูลที่รับเข้ามาผ่าน decorator เช่น `@IsString()`, `@Min()` |
| `class-transformer` | แปลง plain JSON object เป็น class instance เพื่อให้ validator ทำงานได้ |

### 3.4 ลบไฟล์ตัวอย่างที่ NestJS สร้างให้ (ไม่ใช้)

```powershell
# Windows (PowerShell) — คั่นด้วย , ไม่ใช่ space
del src\app.controller.ts, src\app.controller.spec.ts, src\app.service.ts
```

```bash
# macOS / Linux
rm src/app.controller.ts src/app.controller.spec.ts src/app.service.ts
```

> NestJS สร้าง controller และ service ตัวอย่างให้ แต่เราจะสร้างของ products feature เองแทน
> `.spec.ts` คือไฟล์ test — ลบออกเพราะยังไม่ได้ใช้ในโปรเจกต์นี้

---

## ขั้นตอนที่ 4 — ตั้งค่า Prisma (Database ORM)

> **ORM คืออะไร:** Object Relational Mapper — ให้เราคุยกับ Database โดยเขียน TypeScript
> แทนที่จะเขียน SQL เช่น `prisma.product.findMany()` แทน `SELECT * FROM products`

### 4.1 สร้างไฟล์ Prisma

```bash
npx prisma init
```

คำสั่งนี้สร้าง:
- `prisma/schema.prisma` — แบบพิมพ์เขียวของ Database (นิยามตาราง)
- `.env` — ไฟล์เก็บ URL การเชื่อมต่อ DB

### 4.2 แก้ไข `prisma/schema.prisma`

แทนที่เนื้อหาทั้งหมดด้วย:

```prisma
// บอก Prisma ว่าให้สร้าง TypeScript client
generator client {
  provider = "prisma-client-js"
}

// บอกว่า Database คือ PostgreSQL และอ่าน URL จาก .env
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// นิยามตาราง products — แต่ละ field ตรงกับ column ในตาราง
model Product {
  id          Int      @id @default(autoincrement())  // PK, เพิ่มอัตโนมัติ
  name        String                                   // ห้ามว่าง
  description String?                                  // ? = optional (NULL ได้)
  price       Float                                    // ราคา (ทศนิยมได้)
  stock       Int      @default(0)                    // ค่าเริ่มต้น = 0
  createdAt   DateTime @default(now())                // timestamp อัตโนมัติตอนสร้าง
  updatedAt   DateTime @updatedAt                     // timestamp อัตโนมัติตอนแก้ไข

  @@map("products")   // ชื่อตารางใน DB จริงๆ คือ "products" (ไม่ใช่ "Product")
}
```

### 4.3 แก้ไข `.env`

แทนที่เนื้อหาด้วย:

```env
# รูปแบบ: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fullstack_db?schema=public"

# Port ที่ Backend จะรัน
PORT=3001
```

> ค่า `postgres:postgres` ต้องตรงกับ `POSTGRES_USER` และ `POSTGRES_PASSWORD` ใน docker-compose.yml
> ค่า `fullstack_db` ต้องตรงกับ `POSTGRES_DB`

### 4.4 สร้างตารางใน Database

```bash
npx prisma db push
```

> คำสั่งนี้อ่าน `schema.prisma` แล้วสร้างตารางจริงๆ ใน PostgreSQL
> ผลที่ควรเห็น: `Your database is now in sync with your Prisma schema`

### 4.5 สร้าง Prisma Client

```bash
npx prisma generate
```

> สร้าง TypeScript types ให้ Prisma รู้ว่าตาราง `products` มี field อะไรบ้าง
> ถ้าไม่รัน จะ error ตอน compile เพราะ TypeScript ไม่รู้จัก `prisma.product`

---

## ขั้นตอนที่ 5 — เขียน Code Backend

> **โครงสร้าง NestJS:** แบ่งเป็นชั้นชัดเจน
> ```
> HTTP Request → Controller → Service → Prisma → Database
> ```
> Controller รับ request, Service คิด logic, Prisma คุย DB — แต่ละชั้นรู้หน้าที่ตัวเองเท่านั้น

### 5.1 แก้ไข `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // โหลดค่าจาก .env ให้ใช้ได้ทั่วทั้งแอปโดยไม่ต้อง import ซ้ำ
    ConfigModule.forRoot({ isGlobal: true }),

    // PrismaModule = ประกาศว่าแอปนี้ใช้ DB ผ่าน Prisma
    PrismaModule,

    // ProductsModule = feature จัดการสินค้า (CRUD)
    ProductsModule,
  ],
})
export class AppModule {}
```

> **AppModule** คือ root ของแอป — ทุก Module ต้องมาลงทะเบียนที่นี่
> NestJS จะอ่าน imports array แล้วเริ่มต้น Module เหล่านี้ตามลำดับ

### 5.2 แก้ไข `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // สร้าง NestJS Application จาก AppModule
  const app = await NestFactory.create(AppModule);

  // เปิด CORS — อนุญาตให้ Frontend ที่ localhost:3000 เรียก API ได้
  // ถ้าไม่ตั้งค่านี้ browser จะ block request จาก domain อื่น
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // เปิด Validation อัตโนมัติ — ตรวจข้อมูลทุก request ผ่าน DTO
  // whitelist: true = ตัด field ที่ไม่ได้นิยามใน DTO ออกอัตโนมัติ (ป้องกัน injection)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ทุก route จะขึ้นต้นด้วย /api เช่น /api/products
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Backend รันอยู่ที่ http://localhost:${port}/api`);
}

bootstrap();
```

### 5.3 สร้าง PrismaModule และ PrismaService

> **ทำไมต้องมีสองไฟล์นี้:**
> - `PrismaService` = ตัวเชื่อมต่อ Database (ช่างประปา)
> - `PrismaModule` = ประกาศและแจกจ่าย PrismaService ให้ Module อื่นใช้ได้ (บริษัทประปา)
>
> ถ้าไม่มีสองไฟล์นี้ ProductsService จะไม่มี `this.prisma` ใช้ และแอปจะ crash ทันที

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

// @Global() = ทำให้ PrismaService ใช้ได้ทุก Module โดยไม่ต้อง import ซ้ำในแต่ละ Module
@Global()
@Module({
  providers: [PrismaService],   // สร้าง PrismaService และจัดการ lifecycle
  exports: [PrismaService],     // อนุญาตให้ Module อื่น inject PrismaService ได้
})
export class PrismaModule {}
```

**`src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient           // สืบทอดความสามารถทั้งหมดของ PrismaClient
  implements OnModuleInit, OnModuleDestroy  // hook lifecycle ของ NestJS
{
  // onModuleInit — NestJS เรียกอัตโนมัติตอนแอปเริ่ม
  // $connect() = เปิดการเชื่อมต่อกับ Database
  async onModuleInit() {
    await this.$connect();
    console.log('✅ เชื่อมต่อ Database สำเร็จ');
  }

  // onModuleDestroy — NestJS เรียกอัตโนมัติตอนแอปปิด
  // $disconnect() = ปิด connection อย่างสะอาด ป้องกัน connection ค้างใน DB
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

> CLI สร้างไฟล์ให้ครบและ **เชื่อมโยงให้อัตโนมัติ** — import ProductsModule เข้า AppModule,
> และลงทะเบียน Controller + Service ใน ProductsModule ให้เลย
> `--no-spec` = ไม่สร้างไฟล์ test

### 5.5 สร้าง DTO (Data Transfer Object)

> **DTO คืออะไร:** กรอบที่บอกว่า "ข้อมูลที่รับเข้ามาต้องมีหน้าตาแบบนี้"
> ทำงานร่วมกับ `ValidationPipe` ใน main.ts — ถ้าข้อมูลไม่ตรง จะ reject อัตโนมัติ 400 Bad Request

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
  @IsString()           // ต้องเป็น string และต้องมีค่า (ห้ามว่าง)
  name: string;

  @IsOptional()         // ส่งหรือไม่ส่งก็ได้
  @IsString()
  description?: string;

  @IsNumber()           // ต้องเป็นตัวเลข
  @Min(0)               // ต้องไม่ติดลบ
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

// DTO สำหรับ Update — ทุก field เป็น optional เพราะแก้บางส่วนได้
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

> **Service** คือหัวใจของ feature — มี logic ทั้งหมด ไม่รู้เรื่อง HTTP
> รับข้อมูลจาก Controller แล้วคุยกับ Database ผ่าน Prisma

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // Dependency Injection — NestJS ฉีด PrismaService ให้อัตโนมัติ
  // ไม่ต้อง new PrismaService() เอง
  constructor(private readonly prisma: PrismaService) {}

  // CREATE — เพิ่มสินค้าใหม่เข้า DB
  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,   // ?? 0 = ถ้าไม่ส่งมาให้ใช้ 0
      },
    });
  }

  // READ ALL — ดึงสินค้าทั้งหมด เรียงใหม่ไปเก่า
  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // READ ONE — ดึงสินค้าตาม id พร้อม error handling
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    // ถ้าไม่พบ โยน NotFoundException → NestJS แปลงเป็น HTTP 404 อัตโนมัติ
    if (!product) throw new NotFoundException(`ไม่พบสินค้า id: ${id}`);
    return product;
  }

  // UPDATE — ตรวจว่ามีอยู่ก่อน แล้วค่อยแก้ไข
  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);   // ถ้าไม่มีจะ throw 404 ที่นี่เลย
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  // DELETE — ตรวจว่ามีอยู่ก่อน แล้วค่อยลบ
  async remove(id: number) {
    await this.findOne(id);   // ถ้าไม่มีจะ throw 404 ที่นี่เลย
    return this.prisma.product.delete({ where: { id } });
  }
}
```

### 5.7 แทนที่ `src/products/products.controller.ts`

> **Controller** คือด่านหน้า — รับ HTTP request, ดึงข้อมูลจาก URL/Body, ส่งต่อให้ Service
> ไม่มี logic ของตัวเอง รู้แค่ "รับอะไร ส่งต่อไปไหน"

```typescript
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// @Controller('products') + global prefix 'api' → route ทั้งหมดขึ้นต้นด้วย /api/products
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // POST /api/products
  // @Body() ดึงข้อมูล JSON จาก request body มาใส่ใน dto
  // @HttpCode(201) ส่ง status 201 Created แทน 200
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // GET /api/products
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // GET /api/products/:id
  // @Param('id', ParseIntPipe) ดึง :id จาก URL และแปลงจาก string → number อัตโนมัติ
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // PUT /api/products/:id
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // DELETE /api/products/:id
  // @HttpCode(204) ส่ง status 204 No Content (ลบสำเร็จ ไม่มี body ตอบกลับ)
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

// ProductsModule รวม Controller + Service ของ feature "สินค้า" ไว้ด้วยกัน
// เป็น feature module — ทุก feature แยก module ของตัวเอง
@Module({
  controllers: [ProductsController],  // รับ HTTP Request
  providers: [ProductsService],       // Business Logic
})
export class ProductsModule {}
```

### 5.9 ทดสอบรัน Backend

```bash
npm run start:dev
```

> `start:dev` = รันแบบ watch mode — แก้ไข code แล้ว restart อัตโนมัติ

ผลที่ควรเห็น:
```
✅ เชื่อมต่อ Database สำเร็จ
✅ Backend รันอยู่ที่ http://localhost:3001/api
```

ทดสอบ API:
```bash
curl http://localhost:3001/api/products
# ควรได้ []  ← array ว่าง เพราะยังไม่มีสินค้า
```

---

## ขั้นตอนที่ 6 — สร้าง Frontend ด้วย Next.js CLI

เปิด **Terminal ใหม่** (backend ปล่อยให้รันอยู่)

### 6.1 กลับไปที่ root และสร้างโปรเจกต์ Next.js

```bash
cd ..   # กลับจาก backend ไป myProject
```

```bash
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

| Flag | ผลลัพธ์ |
|---|---|
| `--typescript` | ใช้ TypeScript แทน JavaScript — ช่วยจับ bug ก่อน runtime |
| `--tailwind` | ติดตั้ง Tailwind CSS — เขียน style ผ่าน class name |
| `--app` | ใช้ App Router (Next.js 13+) — วิธีใหม่ที่แนะนำ |
| `--no-src-dir` | ไม่สร้างโฟลเดอร์ `src/` — โครงสร้างเรียบง่ายกว่า |
| `--import-alias "@/*"` | ใช้ `@/components/X` แทน `../../components/X` |

เมื่อถามตอบตามนี้:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **No**
- App Router: **Yes**
- Import alias: **Yes** (ใช้ค่าเริ่มต้น `@/*`)

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

> **`NEXT_PUBLIC_`** prefix = ส่งตัวแปรนี้ไปให้ browser ได้
> ถ้าไม่มี prefix จะใช้ได้แค่ฝั่ง Server เท่านั้น
> เมื่อย้าย backend ไป server จริง เปลี่ยนแค่ค่านี้ ไม่ต้องแก้ code

### 7.2 ลบไฟล์ตัวอย่างที่ Next.js สร้างให้

```powershell
# Windows (PowerShell) — คั่นด้วย , ไม่ใช่ space
del app\page.tsx, app\globals.css
```

```bash
# macOS / Linux
rm app/page.tsx app/globals.css
```

> ลบเพื่อสร้างใหม่ด้วย code ของเรา — ไฟล์ตัวอย่างมี style ที่ไม่ต้องการ

---

## ขั้นตอนที่ 8 — เขียน Code Frontend

> **Server Component vs Client Component ใน Next.js App Router:**
> - **Server Component** (default) = render บน server ก่อน → เร็ว, SEO ดี — ใช้เมื่อไม่ต้องการ interactivity
> - **Client Component** (`'use client'`) = render ใน browser — ใช้เมื่อต้องการ `useState`, `useEffect`, หรือ event handler เช่น `onClick`

### 8.1 สร้าง `app/globals.css`

```css
/* โหลด Tailwind CSS 3 layers เข้ามา — ต้องมีทั้ง 3 บรรทัดนี้ */
@tailwind base;        /* reset + default styles */
@tailwind components;  /* reusable component classes */
@tailwind utilities;   /* utility classes เช่น flex, text-xl, bg-blue-600 */
```

### 8.2 แทนที่ `app/layout.tsx`

> **layout.tsx** = กรอบครอบทุกหน้า render ครั้งเดียวไม่ reload ตอนเปลี่ยนหน้า
> เหมาะสำหรับ Navbar, Footer ที่แสดงทุกหน้า

```typescript
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

// metadata = กำหนด <title> และ <meta description> ของ site (SEO)
export const metadata: Metadata = {
  title: 'Full Stack Demo',
  description: 'Next.js + NestJS + PostgreSQL CRUD App',
};

// children = หน้าปัจจุบัน (page.tsx ที่ตรงกับ URL)
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

> หน้าแรก `/` — Server Component เพราะไม่มี interaction ใดๆ แค่แสดงข้อมูลนิ่ง

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

> **lib/api.ts** = รวมฟังก์ชัน fetch ทั้งหมดไว้ที่เดียว
> ทุกหน้าที่ต้องการคุยกับ Backend จะ import จากที่นี่ — แก้ที่เดียวทั้งแอปเปลี่ยน

```bash
# Windows
mkdir lib

# macOS / Linux
mkdir -p lib
```

**`lib/api.ts`**

```typescript
// กำหนด type ของสินค้า — ใช้ร่วมกันทุกหน้า
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

// type สำหรับข้อมูลที่ส่งเข้า form (ไม่มี id, createdAt, updatedAt)
export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  stock?: number;
}

// อ่าน URL จาก .env.local — เปลี่ยน URL ได้โดยไม่แก้ code
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// helper function กลาง — ทุก request ผ่านที่นี่เพื่อจัดการ error ร่วมกัน
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // ถ้า server ตอบ 4xx หรือ 5xx — โยน Error
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'เกิดข้อผิดพลาด' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  // DELETE ตอบ 204 No Content — ไม่มี body ให้ parse
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ฟังก์ชัน CRUD แต่ละตัว — หน้าต่างๆ เรียกใช้ตรงๆ
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

**`components/Navbar.tsx`** — Server Component (ไม่มี onClick)

```typescript
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Link ของ Next.js = navigation ไม่ reload ทั้งหน้า */}
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

**`components/ProductCard.tsx`** — Client Component (มี onClick)

```typescript
'use client';  // ต้องใส่เพราะมี onClick (event handler ทำงานใน browser เท่านั้น)

import Link from 'next/link';
import { Product } from '@/lib/api';

interface Props {
  product: Product;
  onDelete: (id: number) => void;  // รับ function จาก parent page
}

export default function ProductCard({ product, onDelete }: Props) {
  const handleDelete = () => {
    // confirm() เป็น browser dialog — ถ้า user กด OK ค่อยลบจริง
    if (confirm(`ลบ "${product.name}" ใช่ไหม?`)) {
      onDelete(product.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col gap-3">
      <h3 className="font-bold text-gray-800 text-lg leading-tight">
        {product.name}
      </h3>

      {/* แสดงคำอธิบายเฉพาะเมื่อมีค่า */}
      {product.description && (
        <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-blue-600 font-bold text-xl">
          ฿{product.price.toLocaleString()}
        </span>
        {/* เปลี่ยนสีตามสถานะสต็อก */}
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

> **`[id]`** ในชื่อโฟลเดอร์ = dynamic route — Next.js จะจับค่าจาก URL เช่น `/products/5/edit` → `id = 5`

---

**`app/products/page.tsx`** — หน้าแสดงรายการสินค้า (Client Component)

> ใช้ `'use client'` เพราะต้องการ `useState` (เก็บรายการสินค้า) และ `useEffect` (โหลดข้อมูลตอนเปิดหน้า)

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, deleteProduct, Product } from '@/lib/api';

export default function ProductsPage() {
  // state: ข้อมูลที่ใช้ render — เมื่อ state เปลี่ยน React จะ render ใหม่อัตโนมัติ
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect([]) = รันครั้งเดียวตอน Component ถูก mount (เปิดหน้า)
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);         // อัปเดต state → render ใหม่พร้อมข้อมูล
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Backend');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id);
      // กรองสินค้าที่ลบออก — ไม่ต้อง reload ทั้งหน้า UX ดีกว่า
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
        <button onClick={loadProducts} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
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
        // grid responsive: 1 col บนมือถือ, 2 col tablet, 3 col desktop
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

---

**`app/products/new/page.tsx`** — หน้าเพิ่มสินค้า

> แต่ละ field ใช้ `useState` แยกกัน — เมื่อ user พิมพ์ state อัปเดต input แสดงค่าล่าสุด

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();   // ใช้สำหรับ redirect หลัง submit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();   // ป้องกัน browser reload หน้าเมื่อ submit form
    setError(null);
    setLoading(true);

    try {
      await createProduct({
        name,
        description: description || undefined,  // ถ้าว่างส่ง undefined แทน ""
        price: parseFloat(price),               // แปลง string → number
        stock: parseInt(stock) || 0,
      });
      router.push('/products');   // redirect กลับหน้ารายการ
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

---

**`app/products/[id]/edit/page.tsx`** — หน้าแก้ไขสินค้า

> ต่างจากหน้า new ตรงที่ต้องโหลดข้อมูลเดิมมาแสดงก่อน แล้วค่อยให้แก้ไข

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/api';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);   // ดึง id จาก URL เช่น /products/5/edit → id = 5

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดข้อมูลเดิมตอนเปิดหน้า แล้วนำมาใส่ใน state ของ form
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
4. npx prisma init → แก้ schema → npx prisma db push → npx prisma generate
5. เขียน code: main.ts, app.module.ts, PrismaModule/Service, Products CRUD
6. npx create-next-app@14 frontend → ตั้งค่า .env.local
7. เขียน code: globals.css, layout, page, lib/api.ts, components, product pages
8. รัน: npm run start:dev (backend) + npm run dev (frontend)
```

---

## ตรวจสอบว่าทำงานถูกต้อง

| ทดสอบ | ผลที่ควรได้ |
|---|---|
| `http://localhost:3000` | เห็นหน้า Home พร้อม tech stack cards |
| `http://localhost:3000/products` | เห็นหน้ารายการสินค้า (ว่างถ้ายังไม่เพิ่ม) |
| กดปุ่ม "+ เพิ่มสินค้า" | เปิดฟอร์มเพิ่มสินค้า |
| กรอกข้อมูลแล้วกด บันทึก | redirect กลับ และสินค้าปรากฏในรายการ |
| กดแก้ไข | เปิดฟอร์มพร้อมข้อมูลเดิม |
| กดลบ → ยืนยัน | สินค้าหายออกจากรายการทันที |
| `http://localhost:3001/api/products` | ได้ JSON array ของสินค้าทั้งหมด |
