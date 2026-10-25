import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { CacheService } from '@backend/services/cache.service';
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
    private readonly cache: CacheService,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern('banner:*');
  }

  async getBanners(placement?: 'HERO' | 'PROMO' | 'CATEGORY') {
    const cacheKey = `banner:list:${placement || 'all'}`;
    return this.cache.remember(cacheKey, 1800, async () => {
      return this.prisma.banner.findMany({
        where: {
          isActive: true,
          ...(placement ? { placement } : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          buttonText: true,
          imageUrl: true,
          placement: true,
          linkUrl: true,
        },
      });
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
        title: 'Dussehra & Vijayadashami Festive Weaves',
        subtitle:
          'Opulent crimson red & mustard gold Banarasi silk sarees woven for celebration.',
        buttonText: 'Shop Sarees',
        imageUrl: '/banners/dussehra_festival.jpg',
        placement: 'HERO' as const,
      },
      {
        title: 'Karwa Chauth Moonlit Bridal Elegance',
        subtitle:
          'Exquisite bridal lehengas & pure silk sarees crafted for sacred rituals.',
        buttonText: 'Shop Lehengas',
        imageUrl: '/banners/karwa_chauth.jpg',
        placement: 'HERO' as const,
      },
      {
        title: 'Diwali Deepotsav: Women & Girls Royal Edit',
        subtitle:
          'Radiant designer lehengas, sequins Anarkalis & festive matching sets.',
        buttonText: 'Shop Diwali Edit',
        imageUrl: '/banners/diwali_women_girls.jpg',
        placement: 'HERO' as const,
      },
      {
        title: 'Chhath Puja Mahaparv: Sacred Handloom Weaves',
        subtitle:
          'Auspicious turmeric yellow & vermillion red handloom pure silk sarees for Arghya.',
        buttonText: 'Shop Chhath Sarees',
        imageUrl: '/banners/chhath_puja.jpg',
        placement: 'HERO' as const,
      },
      {
        title: 'Diwali Celebration: Men & Boys Royal Ethnic Wear',
        subtitle:
          'Matching royal navy blue & gold embroidered silk kurtas, Nehru jackets and sherwanis.',
        buttonText: "Shop Men's Diwali",
        imageUrl: '/banners/diwali_men_boys.jpg',
        placement: 'HERO' as const,
      },
    ];

    const categoryBanners = [
      {
        title: 'Festive Banarasi Sarees',
        subtitle:
          'Pure mulberry silk with real gold and silver electroplated zari.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/dussehra_festival.jpg',
        placement: 'CATEGORY' as const,
        linkUrl: 'sarees',
      },
      {
        title: 'Bridal & Party Lehengas',
        subtitle:
          'Opulent mirror work, sequins, and velvet borders for royal ceremonies.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/karwa_chauth.jpg',
        placement: 'CATEGORY' as const,
        linkUrl: 'lehengas',
      },
      {
        title: "Men's Royal Ethnic Wear",
        subtitle:
          'Impeccable fits, celebratory hues, and heritage hand-embroidered kurtas.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/diwali_men_boys.jpg',
        placement: 'CATEGORY' as const,
        linkUrl: 'mens-ethnic',
      },
      {
        title: 'Anarkali Sets & Suits',
        subtitle:
          'Lightweight flowy fabrics, organza dupattas, and contemporary regal drapes.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/diwali_women_girls.jpg',
        placement: 'CATEGORY' as const,
        linkUrl: 'kurtis-suits',
      },
      {
        title: 'Chhath Puja Sacred Collection',
        subtitle:
          'Pure auspicious handloom weaves for divine sunrise offerings.',
        buttonText: 'Shop Now',
        imageUrl: '/banners/chhath_puja.jpg',
        placement: 'CATEGORY' as const,
        linkUrl: 'sarees',
      },
    ];

    await this.prisma.banner.createMany({
      data: [...heroBanners, ...categoryBanners],
    });

    await this.invalidateCache();
    return { count: 10 };
  }

  async createBanner(input: z.infer<typeof CreateBannerSchema>) {
    // Upload image to cloudinary
    const { url, publicId } = await this.cloudinary.uploadImage(
      input.imageData,
      'anmol/banners',
    );

    const created = await this.prisma.banner.create({
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

    await this.invalidateCache();
    return created;
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

    const updated = await this.prisma.banner.update({
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

    await this.invalidateCache();
    return updated;
  }

  async deleteBanner(id: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) notFound('Banner');

    if (existing.publicId) {
      await this.cloudinary.deleteImage(existing.publicId).catch(() => {
        console.warn(`Failed to delete banner image: ${existing.publicId}`);
      });
    }

    const deleted = await this.prisma.banner.delete({
      where: { id },
    });

    await this.invalidateCache();
    return deleted;
  }
}
