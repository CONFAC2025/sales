import api from './api';

export interface SiteSettings {
  logoUrl?: string;
  bannerUrl?: string;
  topText?: string;
  bottomBannerUrl?: string;
  bottomBannerLink?: string;
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const response = await api.get('/site-settings');
  return response.data.data;
};

export const updateSiteSettings = async (data: FormData): Promise<SiteSettings> => {
  const response = await api.put('/site-settings', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};
