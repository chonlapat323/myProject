// src/prisma/prisma.service.ts
// PrismaService — Wrapper ของ PrismaClient สำหรับ NestJS

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // onModuleInit — เรียกตอน Module โหลด: เชื่อมต่อ Database
  async onModuleInit() {
    await this.$connect();
    console.log('✅ เชื่อมต่อ Database สำเร็จ');
  }

  // onModuleDestroy — เรียกตอนปิดแอป: ตัดการเชื่อมต่อ Database
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 ตัดการเชื่อมต่อ Database แล้ว');
  }
}
