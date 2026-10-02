import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { Metadata } from "next";
import { LinkButton } from "@/components/common/LinkButton";
import { PageHeader } from "@/components/common/PageHeader";
import { routes } from "@/config/routes";
import { ProductForm } from "@/features/admin/products/ProductForm";

export const metadata: Metadata = { title: "Add product" };

export default function AdminNewProductPage() {
  return (
    <>
      <LinkButton href={routes.admin.products} startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>
        Products
      </LinkButton>
      <PageHeader title="Add product" description="Pick a category first: it decides the specification fields and variant options." />
      <ProductForm />
    </>
  );
}
