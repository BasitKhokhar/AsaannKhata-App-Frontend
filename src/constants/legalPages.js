export const LEGAL_SITE_ORIGIN = 'https://asaandukaannlegalpages.netlify.app';

export const LEGAL_PAGE_URLS = Object.freeze({
  home: `${LEGAL_SITE_ORIGIN}/`,
  privacy: `${LEGAL_SITE_ORIGIN}/privacy-policy`,
  terms: `${LEGAL_SITE_ORIGIN}/terms-of-service`,
  deleteAccount: `${LEGAL_SITE_ORIGIN}/delete-account`,
});

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@asaankhata.app';
