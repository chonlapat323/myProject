// src/products/dto/create-product.dto.ts
// DTO (Data Transfer Object) — กำหนดรูปแบบข้อมูลที่รับจาก Client

import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  // @IsString() — ต้องเป็น string และต้องมีค่า
  @IsString()
  name: string;

  // @IsOptional() — ส่งหรือไม่ส่งก็ได้
  @IsOptional()
  @IsString()
  description?: string;

  // @IsNumber() — ต้องเป็นตัวเลข
  // @Min(0) — ต้องไม่ติดลบ
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
