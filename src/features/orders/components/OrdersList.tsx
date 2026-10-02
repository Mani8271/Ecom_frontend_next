"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ordersService } from "@/services/orders/orders.service";
import type { OrderSummaryRow } from "@/services/orders/types";
import { OrderStatusChip } from "./OrderStatusChip";

const TABS = [
  { value: "", label: "All" },
  { value: "active", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returns", label: "Returns" },
];
const PAGE_SIZE = 10;

export function OrderRow({ order }: { order: OrderSummaryRow }) {
  return (
    <Box
      component={NextLink}
      href={routes.account.order(order.order_number)}
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "center",
        p: 2,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 4,
        textDecoration: "none",
        color: "inherit",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 52, height: 64, borderRadius: 2 } }}>
        {order.preview_images.length ? order.preview_images.map((src) => <Avatar key={src} variant="rounded" src={src} alt="" />) : <Avatar variant="rounded" />}
      </AvatarGroup>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="subtitle2">{order.order_number}</Typography>
          <OrderStatusChip status={order.status} label={order.status_label} />
        </Stack>
        <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
          {order.first_item_name}
          {order.item_count > 1 ? ` + ${order.item_count - 1} more` : ""}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatDateTime(order.placed_at)} · {formatPrice(order.grand_total)} · {order.payment_method_label}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ color: "text.secondary" }} />
    </Box>
  );
}

export function OrdersList() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders", "list", { status, page }],
    queryFn: () => ordersService.list({ status: status || undefined, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Orders" description="Track, cancel or return your orders." />
      <Tabs
        value={status}
        onChange={(_, v: string) => {
          setStatus(v);
          setPage(1);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      {isLoading ? (
        <ListSkeleton rows={4} height={96} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<ReceiptLongOutlinedIcon />}
          title={status ? "No orders here" : "No orders yet"}
          description="When you place an order, it will appear here."
          action={
            <LinkButton href={routes.search()} variant="contained">
              Start shopping
            </LinkButton>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {data.data.map((order) => (
            <OrderRow key={order.order_number} order={order} />
          ))}
          {data.pagination.last_page > 1 && (
            <Stack sx={{ alignItems: "center", pt: 2 }}>
              <Pagination count={data.pagination.last_page} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
            </Stack>
          )}
        </Stack>
      )}
    </>
  );
}
