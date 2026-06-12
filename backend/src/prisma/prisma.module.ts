// src/prisma/prisma.module.ts
// PrismaModule — Export PrismaService ให้ Module อื่นใช้งานได้

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — ทำให้ PrismaService ใช้ได้ทุก Module โดยไม่ต้อง import ซ้ำ
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
