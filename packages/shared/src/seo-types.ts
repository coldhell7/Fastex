/**
 * Shared SEO settings type used by both admin and storefront.
 * Admin adds robotsTxt/llmsTxt on top of these.
 */
export type SeoSettings = {
  metaTitleTemplate: string;
  metaDescriptionTemplate: string;
  canonicalBaseUrl: string;
  ogImageDefault: string;
  sitemapEnabled: boolean;
  structuredDataEnabled: boolean;
  twitterCardType: string;
  twitterSite: string;
  twitterCreator: string;
  ogTypeDefault: string;
  ogSiteName: string;
  fbAppId: string;
  enableLazyLoading: boolean;
  enablePreload: boolean;
  enablePrefetch: boolean;
  enableHttpsRedirect: boolean;
  enableSecurityHeaders: boolean;
  hstsMaxAge: number;
};

export const SEO_DEFAULTS: SeoSettings = {
  metaTitleTemplate: "{title} | {siteName}",
  metaDescriptionTemplate: "{description}",
  canonicalBaseUrl: "https://medalino.ir",
  ogImageDefault: "/images/og-default.jpg",
  sitemapEnabled: true,
  structuredDataEnabled: true,
  twitterCardType: "summary_large_image",
  twitterSite: "@medalino",
  twitterCreator: "@medalino",
  ogTypeDefault: "website",
  ogSiteName: "Medalino",
  fbAppId: "",
  enableLazyLoading: true,
  enablePreload: true,
  enablePrefetch: true,
  enableHttpsRedirect: true,
  enableSecurityHeaders: true,
  hstsMaxAge: 31536000,
};
