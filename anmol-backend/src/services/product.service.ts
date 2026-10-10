import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { ProductQueries } from '@backend/services/product/product.queries';
import { ProductMutations } from '@backend/services/product/product.mutations';
import { z } from 'zod';
import {
  ListProductSchema,
  productBaseSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  SetProductActiveSchema,
  UpsertVariantSchema,
  DeleteVariantSchema,
  AdjustStockSchema,
  UploadImageSchema,
  AddImageSchema,
  RemoveImageSchema,
} from '@backend/models/product.model';

@Injectable()
export class ProductService {
  private queries: ProductQueries;
  private mutations: ProductMutations;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {
    this.queries = new ProductQueries(this.prisma);
    this.mutations = new ProductMutations(this.prisma, this.cloudinary);
  }

  async list(input?: z.infer<typeof ListProductSchema>) {
    return this.queries.list(input);
  }

  async getById(id: string) {
    return this.queries.getById(id);
  }

  async getBySlug(slug: string) {
    return this.queries.getBySlug(slug);
  }

  async getOutOfStockVariants() {
    return this.queries.getOutOfStockVariants();
  }

  async getRecommendations(productId: string) {
    return this.queries.getRecommendations(productId);
  }

  async create(input: z.infer<typeof productBaseSchema>, userId: string) {
    return this.mutations.create(input, userId);
  }

  async update(input: z.infer<typeof UpdateProductSchema>, userId: string) {
    return this.mutations.update(input, userId);
  }

  async delete(input: z.infer<typeof DeleteProductSchema>) {
    return this.mutations.delete(input);
  }

  async setActive(input: z.infer<typeof SetProductActiveSchema>) {
    return this.mutations.setActive(input);
  }

  async upsertVariant(input: z.infer<typeof UpsertVariantSchema>) {
    return this.mutations.upsertVariant(input);
  }

  async deleteVariant(input: z.infer<typeof DeleteVariantSchema>) {
    return this.mutations.deleteVariant(input);
  }

  async adjustStock(input: z.infer<typeof AdjustStockSchema>) {
    return this.mutations.adjustStock(input);
  }

  async uploadImage(input: z.infer<typeof UploadImageSchema>) {
    return this.mutations.uploadImage(input);
  }

  async addImage(input: z.infer<typeof AddImageSchema>) {
    return this.mutations.addImage(input);
  }

  async removeImage(input: z.infer<typeof RemoveImageSchema>) {
    return this.mutations.removeImage(input);
  }
}
