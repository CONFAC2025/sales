import { prisma } from '../utils/prisma';
import { SiteSettings, Prisma } from '@prisma/client';

export class SiteSettingsService {
  public static async getSiteSettings(): Promise<SiteSettings | null> {
    return prisma.siteSettings.findUnique({ where: { id: 1 } });
  }

  public static async updateSiteSettings(data: { logoUrl?: string, bannerUrl?: string, topText?: string, bottomBannerUrl?: string, bottomBannerLink?: string }): Promise<SiteSettings> {
    return prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        topText: data.topText,
        bottomBannerUrl: data.bottomBannerUrl,
        bottomBannerLink: data.bottomBannerLink,
      },
    });
  }
}
