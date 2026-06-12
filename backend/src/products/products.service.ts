// src/products/products.service.ts
// ProductsService — Business Logic ทั้งหมดของ CRUD

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  // Inject PrismaService ผ่าน Constructor (Dependency Injection)
  constructor(private readonly prisma: PrismaService) {}

  // =============================
  // CREATE — สร้างสินค้าใหม่
  // =============================
  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,   // ถ้าไม่ส่งมา ใช้ 0
      },
    });
    return product;
  }

  // =============================
  // READ ALL — ดึงสินค้าทั้งหมด
  // =============================
  async findAll() {
    // orderBy: เรียงจากใหม่ไปเก่า
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // =============================
  // READ ONE — ดึงสินค้าตาม id
  // =============================
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    // ถ้าไม่พบ — โยน 404 Not Found
    if (!product) {
      throw new NotFoundException(`ไม่พบสินค้า id: ${id}`);
    }

    return product;
  }

  // =============================
  // UPDATE — แก้ไขข้อมูลสินค้า
  // =============================
  async update(id: number, dto: UpdateProductDto) {
    // ตรวจสอบก่อนว่ามีอยู่จริง
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  // =============================
  // DELETE — ลบสินค้า
  // =============================
  async remove(id: number) {
    // ตรวจสอบก่อนว่ามีอยู่จริง
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
