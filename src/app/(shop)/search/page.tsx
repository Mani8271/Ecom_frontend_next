import type { Metadata } from "next";
import { ListingView } from "@/features/catalog/components/ListingView";
import { toApiQuery } from "@/features/catalog/listing-params";
import { catalogService } from "@/services/catalog/catalog.service";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  return {
    title: term ? `Results for “${term}”` : "All products",
    // Search result pages are endless combinations; keep them out of the index.
    robots: term ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const listing = await catalogService.products(toApiQuery(params));
  const term = typeof params.q === "string" ? params.q.trim() : "";

  return <ListingView title={term ? `Results for “${term}”` : "All products"} listing={listing} params={params} />;
}
