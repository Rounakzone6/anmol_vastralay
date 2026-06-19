import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  AddToCartSchema,
  UpdateCartQuantitySchema,
  RemoveFromCartSchema,
} from '../models/cart.model';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              },
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  }

  async addToCart(userId: string, input: z.infer<typeof AddToCartSchema>) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId || null,
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + input.quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId || null,
        quantity: input.quantity,
      },
    });
  }

  async updateQuantity(userId: string, input: z.infer<typeof UpdateCartQuantitySchema>) {
    // Ensure the item belongs to user's cart
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: input.cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Cart item not found' });
    }

    if (input.quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: input.cartItemId },
      });
      return { deleted: true };
    }

    return this.prisma.cartItem.update({
      where: { id: input.cartItemId },
      data: { quantity: input.quantity },
    });
  }

  async removeFromCart(userId: string, input: z.infer<typeof RemoveFromCartSchema>) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: input.cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Cart item not found' });
    }

    await this.prisma.cartItem.delete({
      where: { id: input.cartItemId },
    });

    return { success: true };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { success: true };
  }
}
