import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { routes } from "@/config/routes";
import { ListingView } from "@/features/catalog/components/ListingView";
import { toApiQuery } from "@/features/catalog/listing-params";
import { isApiError } from "@/services/api/errors";
import { catalogService } from "@/services/catalog/catalog.service";

/** One request per render, shared by metadata and the page. */
const getCategory = cache(async (slug: string) => {
  try {
    return (await catalogService.category(slug)).data;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return {
    title: category.seo.title,
    description: category.seo.description ?? category.description ?? undefined,
    alternates: { canonical: routes.category(category.slug) },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const [category, listing] = await Promise.all([getCategory(slug), catalogService.products(toApiQuery(query, slug))]);

  return (
    <ListingView
      title={category.name}
      description={category.description}
      breadcrumbs={category.breadcrumbs.map((c) => ({ name: c.name, href: routes.category(c.slug) }))}
      subcategories={category.children?.map((c) => ({ name: c.name, slug: c.slug }))}
      listing={listing}
      params={query}
    />
  );
}
