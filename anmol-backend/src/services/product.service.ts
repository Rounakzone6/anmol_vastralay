import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { ProductQueries } from '@backend/services/product/product.queries';
import { ProductMutations } from '@backend/services/product/product.mutations';
import { SearchBloomService } from '@backend/services/search-bloom.service';
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
    private readonly searchBloom: SearchBloomService,
  ) {
    this.queries = new ProductQueries(this.prisma, this.searchBloom);
    this.mutations = new ProductMutations(this.prisma, this.cloudinary);
  }

  async list(input?: z.infer<typeof ListProductSchema>, isStaff = false) {
    return this.queries.list(input, isStaff);
  }

  async searchSuggestions(query: string, limit?: number) {
    return this.queries.searchSuggestions(query, limit);
  }

  async getById(id: string, isStaff = false) {
    return this.queries.getById(id, isStaff);
  }

  async getBySlug(slug: string, isStaff = false) {
    return this.queries.getBySlug(slug, isStaff);
  }

  async getOutOfStockVariants() {
    return this.queries.getOutOfStockVariants();
  }

  async getRecommendations(productId: string) {
    return this.queries.getRecommendations(productId);
  }

  async getSitemapProducts(page?: number, pageSize?: number) {
    return this.queries.getSitemapProducts(page, pageSize);
  }


  async create(input: z.infer<typeof productBaseSchema>, userId: string) {
    const res = await this.mutations.create(input, userId);
    let categoryName: string | undefined;
    if (input.categoryId) {
      try {
        const cat = await this.prisma.category.findUnique({
          where: { id: input.categoryId },
          select: { name: true },
        });
        categoryName = cat?.name;
      } catch {}
    }
    this.searchBloom.indexProduct(input.name, categoryName, input.brand);
    return res;
  }

  async update(input: z.infer<typeof UpdateProductSchema>, userId: string) {
    const res = await this.mutations.update(input, userId);
    if (input.name || input.brand || input.categoryId) {
      this.searchBloom.scheduleDebouncedRebuild();
    }
    return res;
  }

  async delete(input: z.infer<typeof DeleteProductSchema>) {
    const res = await this.mutations.delete(input);
    this.searchBloom.scheduleDebouncedRebuild();
    return res;
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
