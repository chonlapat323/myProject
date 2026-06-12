// src/products/products.controller.ts
// ProductsController — รับ HTTP Request แล้วส่งต่อไป Service
//
// Route ทั้งหมด (prefix: /api/products):
//   POST   /api/products       — สร้างสินค้า
//   GET    /api/products       — ดึงสินค้าทั้งหมด
//   GET    /api/products/:id   — ดึงสินค้าตาม id
//   PUT    /api/products/:id   — แก้ไขสินค้า
//   DELETE /api/products/:id   — ลบสินค้า

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')   // prefix: /api/products
export class ProductsController {
  // Inject ProductsService ผ่าน Constructor
  constructor(private readonly productsService: ProductsService) {}

  // POST /api/products — สร้างสินค้าใหม่
  // @Body() — ดึงข้อมูลจาก Request Body
  @Post()
  @HttpCode(HttpStatus.CREATED)   // ส่ง 201 Created
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // GET /api/products — ดึงสินค้าทั้งหมด
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // GET /api/products/:id — ดึงสินค้าตาม id
  // @Param('id', ParseIntPipe) — แปลง string เป็น number อัตโนมัติ
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // PUT /api/products/:id — แก้ไขสินค้า
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  // DELETE /api/products/:id — ลบสินค้า
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)   // ส่ง 204 No Content
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
