import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import RemoveShoppingCartOutlinedIcon from "@mui/icons-material/RemoveShoppingCartOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import type { ReactNode } from "react";
import { routes } from "@/config/routes";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Shown only to users with this permission (the API enforces it too). */
  permission: string;
}

export const adminNav: { heading?: string; items: AdminNavItem[] }[] = [
  { items: [{ href: routes.admin.root, label: "Dashboard", icon: <DashboardOutlinedIcon />, permission: "dashboard.view" }] },
  {
    heading: "Catalog",
    items: [
      { href: routes.admin.products, label: "Products", icon: <Inventory2OutlinedIcon />, permission: "products.view" },
      { href: routes.admin.categories, label: "Categories", icon: <CategoryOutlinedIcon />, permission: "categories.view" },
      { href: routes.admin.brands, label: "Brands", icon: <SellOutlinedIcon />, permission: "brands.view" },
      { href: routes.admin.attributes, label: "Attributes", icon: <TuneOutlinedIcon />, permission: "attributes.view" },
    ],
  },
  {
    heading: "Sales",
    items: [
      { href: routes.admin.orders, label: "Orders", icon: <ReceiptLongOutlinedIcon />, permission: "orders.view" },
      { href: routes.admin.analytics, label: "Sales analytics", icon: <ShowChartIcon />, permission: "dashboard.view" },
      { href: routes.admin.customers, label: "Customers", icon: <PeopleOutlineIcon />, permission: "customers.view" },
      { href: routes.admin.payments, label: "Payments", icon: <PaymentsOutlinedIcon />, permission: "payments.view" },
    ],
  },
  {
    heading: "Inventory",
    items: [
      { href: routes.admin.inventory, label: "Inventory", icon: <WarehouseOutlinedIcon />, permission: "inventory.view" },
      { href: routes.admin.inventoryHistory, label: "Stock history", icon: <HistoryOutlinedIcon />, permission: "inventory.view" },
      { href: routes.admin.lowStock, label: "Low stock", icon: <WarningAmberOutlinedIcon />, permission: "inventory.view" },
      { href: routes.admin.outOfStock, label: "Out of stock", icon: <RemoveShoppingCartOutlinedIcon />, permission: "inventory.view" },
    ],
  },
  {
    heading: "Marketing",
    items: [
      { href: routes.admin.coupons, label: "Coupons", icon: <LocalOfferOutlinedIcon />, permission: "coupons.view" },
      { href: routes.admin.reviews, label: "Reviews", icon: <RateReviewOutlinedIcon />, permission: "reviews.view" },
    ],
  },
  {
    heading: "Returns",
    items: [
      { href: routes.admin.returns, label: "Returns", icon: <AssignmentReturnOutlinedIcon />, permission: "returns.view" },
      { href: routes.admin.refunds, label: "Refunds", icon: <CurrencyRupeeOutlinedIcon />, permission: "payments.view" },
    ],
  },
  {
    heading: "Reports",
    items: [
      { href: routes.admin.report("sales"), label: "Sales report", icon: <AssessmentOutlinedIcon />, permission: "reports.view" },
      { href: routes.admin.report("inventory"), label: "Inventory report", icon: <AssessmentOutlinedIcon />, permission: "reports.view" },
      { href: routes.admin.report("customers"), label: "Customer report", icon: <AssessmentOutlinedIcon />, permission: "reports.view" },
      { href: routes.admin.report("payments"), label: "Payment report", icon: <AssessmentOutlinedIcon />, permission: "reports.view" },
      { href: routes.admin.reports, label: "All reports", icon: <AssessmentOutlinedIcon />, permission: "reports.view" },
    ],
  },
  { items: [{ href: routes.admin.settings, label: "Settings", icon: <SettingsOutlinedIcon />, permission: "settings.view" }] },
];

/** The nav entry for a path: the longest matching href wins (/admin/inventory/history ≠ /admin/inventory). */
export function activeNavHref(pathname: string, hrefs: string[]): string | null {
  return hrefs.filter((href) => (href === routes.admin.root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`))).sort((a, b) => b.length - a.length)[0] ?? null;
}
