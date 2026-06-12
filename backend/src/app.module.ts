// src/app.module.ts
// Root Module — รวมทุก Module ของแอปพลิเคชัน

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // โหลดตัวแปรจากไฟล์ .env ให้ใช้ได้ทั่วทั้งแอป
    ConfigModule.forRoot({ isGlobal: true }),

    // PrismaModule — จัดการการเชื่อมต่อ Database
    PrismaModule,

    // ProductsModule — จัดการข้อมูลสินค้า (CRUD)
    ProductsModule,
  ],
})
export class AppModule {}
