import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { notFound } from '@backend/config/trpc.config';
import { z } from 'zod';
import {
  CreateBannerSchema,
  UpdateBannerSchema,
} from '@backend/models/banner.model';

@Injectable()
export class BannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async getBanners(placement?: 'HERO' | 'PROMO' | 'CATEGORY') {
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminGetBanners() {
    return this.prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async seedBanners() {
    const count = await this.prisma.banner.count();
    if (count > 0) return { count };

    const heroBanners = [
      {
        title: 'Exquisite Ethnic Wear',
        subtitle: 'Discover premium sarees for every occasion',
        buttonText: 'Shop Sarees',
        imageUrl: '/banners/saree.png',
        placement: 'HERO' as const,
      },
      {
        title: "Men's Premium Collection",
        subtitle: 'Elevate your style with our latest arrivals',
        buttonText: 'Shop Men',
        imageUrl: '/banners/mens.png',
        placement: 'HERO' as const,
      },
      {
        title: 'Modern Western Wear',
        subtitle: 'Chic, comfortable styles for the modern woman',
        buttonText: 'Shop Western',
        imageUrl: '/banners/ladies.png',
        placement: 'HERO' as const,
      },
      {
        title: "Kids' Fashion",
        subtitle: 'Vibrant and comfortable outfits for your little ones',
        buttonText: 'Shop Kids',
        imageUrl: '/banners/kids.png',
        placement: 'HERO' as const,
      },
      {
        title: 'Festive Specials',
        subtitle: 'Complete your look with our exclusive accessories',
        buttonText: 'Shop Accessories',
        imageUrl: '/banners/accessories.png',
        placement: 'HERO' as const,
      },
    ];

    const categoryBanners = [
      {
        title: 'Premium Sarees',
        subtitle: 'Elegance woven into every thread.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/banner_saree.png',
        placement: 'CATEGORY' as const,
        linkUrl: 'saree', // We use linkUrl to store the category slug for category banners
      },
      {
        title: "Women's Collection",
        subtitle: 'Vibrant, chic, and ready for any occasion.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/banner_women.png',
        placement: 'CATEGORY' as const,
        linkUrl: 'women',
      },
      {
        title: "Men's Collection",
        subtitle: 'Crisp, professional, and stylish.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/banner_men.png',
        placement: 'CATEGORY' as const,
        linkUrl: 'men',
      },
      {
        title: 'Kidswear',
        subtitle: 'Playful, colorful, and energetic.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/banner_kids.png',
        placement: 'CATEGORY' as const,
        linkUrl: 'kids',
      },
      {
        title: 'Innerwear Essentials',
        subtitle: 'Everyday comfort, elevated.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/banner_innerwear.png',
        placement: 'CATEGORY' as const,
        linkUrl: 'innerwear',
      },
    ];

    await this.prisma.banner.createMany({
      data: [...heroBanners, ...categoryBanners],
    });

    return { count: 10 };
  }

  async createBanner(input: z.infer<typeof CreateBannerSchema>) {
    // Upload image to cloudinary
    const { url, publicId } = await this.cloudinary.uploadImage(
      input.imageData,
      'anmol/banners',
    );

    return this.prisma.banner.create({
      data: {
        title: input.title,
        subtitle: input.subtitle || null,
        buttonText: input.buttonText || null,
        imageUrl: url,
        publicId: publicId,
        placement: input.placement,
        linkUrl: input.linkUrl || null,
        isActive: input.isActive,
      },
    });
  }

  async updateBanner(input: z.infer<typeof UpdateBannerSchema>) {
    const existing = await this.prisma.banner.findUnique({
      where: { id: input.id },
    });
    if (!existing) notFound('Banner');

    let newUrl = existing.imageUrl;
    let newPublicId = existing.publicId;

    if (input.imageData) {
      // Upload new image
      const result = await this.cloudinary.uploadImage(
        input.imageData,
        'anmol/banners',
      );
      newUrl = result.url;
      newPublicId = result.publicId;

      // Delete old image if it existed
      if (existing.publicId) {
        await this.cloudinary.deleteImage(existing.publicId).catch(() => {
          console.warn(
            `Failed to delete old banner image: ${existing.publicId}`,
          );
        });
      }
    }

    return this.prisma.banner.update({
      where: { id: input.id },
      data: {
        title: input.title ?? existing.title,
        subtitle:
          input.subtitle !== undefined
            ? input.subtitle || null
            : existing.subtitle,
        buttonText:
          input.buttonText !== undefined
            ? input.buttonText || null
            : existing.buttonText,
        imageUrl: newUrl,
        publicId: newPublicId,
        placement: input.placement ?? existing.placement,
        linkUrl:
          input.linkUrl !== undefined
            ? input.linkUrl || null
            : existing.linkUrl,
        isActive: input.isActive ?? existing.isActive,
      },
    });
  }

  async deleteBanner(id: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) notFound('Banner');

    if (existing.publicId) {
      await this.cloudinary.deleteImage(existing.publicId).catch(() => {
        console.warn(`Failed to delete banner image: ${existing.publicId}`);
      });
    }

    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
