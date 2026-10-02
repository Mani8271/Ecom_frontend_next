export const siteConfig = {
  name: "Godavari Kart",
  shortName: "Godavari Kart",
  description: "Shop premium fashion and everyday essentials online at Godavari Kart. Easy returns, secure payments and fast delivery across India.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_IN",
  currency: "INR",
} as const;
