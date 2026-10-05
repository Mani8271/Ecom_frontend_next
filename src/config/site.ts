export const siteConfig = {
  name: "Loomi Trends",
  shortName: "Loomi Trends",
  description: "Shop premium fashion and everyday essentials online at Loomi Trends. Easy returns, secure payments and fast delivery across India.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_IN",
  currency: "INR",
} as const;
