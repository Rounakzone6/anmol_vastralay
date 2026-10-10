import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { TRPCError } from '@trpc/server';
import { redis } from '@backend/config/redis.config';
import { z } from 'zod';
import {
  AddToCartSchema,
  UpdateCartQuantitySchema,
  RemoveFromCartSchema,
} from '@backend/models/cart.model';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private getCartKey(userId: string) {
    return `cart:${userId}`;
  }

  async getCart(userId: string) {
    const cartKey = this.getCartKey(userId);
    const cartData = await redis.hgetall(cartKey);

    if (!cartData || Object.keys(cartData).length === 0) {
      return { id: `cart-${userId}`, items: [] };
    }

    const itemsToFetch = Object.entries(cartData).map(([field, quantityStr]) => {
      const [productId, variantId] = field.split('::');
      return {
        field,
        productId,
        variantId: variantId || null,
        quantity: parseInt(quantityStr, 10),
      };
    });

    const productIds = itemsToFetch.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        netPrice: true,
        discountPercent: true,
        images: {
          take: 1,
          select: { url: true, altText: true },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          select: { id: true, color: true, size: true, stockQty: true },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = itemsToFetch.flatMap((item) => {
      const product = productMap.get(item.productId);
      if (!product) return [];

      let variant: typeof product.variants[0] | null = null;
      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId) || null;
      }

      const { variants, ...productWithoutVariants } = product;

      return [{
        id: item.field,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        product: productWithoutVariants,
        variant,
      }];
    });

    return {
      id: `cart-${userId}`,
      items,
    };
  }

  async addToCart(userId: string, input: z.infer<typeof AddToCartSchema>) {
    const cartKey = this.getCartKey(userId);
    const field = `${input.productId}::${input.variantId || ''}`;
    
    await redis.hincrby(cartKey, field, input.quantity);
    await redis.expire(cartKey, 30 * 86400);
    
    return { success: true, id: field };
  }

  async updateQuantity(
    userId: string,
    input: z.infer<typeof UpdateCartQuantitySchema>,
  ) {
    const cartKey = this.getCartKey(userId);
    
    if (input.quantity <= 0) {
      await redis.hdel(cartKey, input.cartItemId);
      return { deleted: true };
    }

    await redis.hset(cartKey, input.cartItemId, input.quantity);
    await redis.expire(cartKey, 30 * 86400);
    
    return { success: true };
  }

  async removeFromCart(
    userId: string,
    input: z.infer<typeof RemoveFromCartSchema>,
  ) {
    const cartKey = this.getCartKey(userId);
    await redis.hdel(cartKey, input.cartItemId);
    return { success: true };
  }

  async clearCart(userId: string) {
    const cartKey = this.getCartKey(userId);
    await redis.del(cartKey);
    return { success: true };
  }
}
