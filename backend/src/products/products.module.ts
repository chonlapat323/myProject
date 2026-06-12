// src/products/products.module.ts
// ProductsModule — รวม Controller + Service ของ Feature "Products"

import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],  // รับ HTTP Request
  providers: [ProductsService],       // Business Logic
})
export class ProductsModule {}
