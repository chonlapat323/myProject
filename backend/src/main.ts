// src/main.ts
// จุดเริ่มต้นของ NestJS Application (Entry Point)

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. สร้าง NestJS Application จาก AppModule
  const app = await NestFactory.create(AppModule);

  // 2. เปิด CORS — อนุญาตให้ Frontend (Next.js) เรียก API ได้
  app.enableCors({
    origin: 'http://localhost:3000',  // URL ของ Frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // 3. เปิด Global Validation — ตรวจสอบ DTO อัตโนมัติทุก Route
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // 4. กำหนด prefix ทุก API จะขึ้นต้นด้วย /api
  app.setGlobalPrefix('api');

  // 5. รับ port จาก env หรือใช้ 3001 เป็นค่าเริ่มต้น
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`✅ Backend รันอยู่ที่ http://localhost:${port}/api`);
}

bootstrap();
