"use client";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { OrderRow } from "@/features/orders/components/OrdersList";
import { formatAddressLines } from "@/lib/format";
import { accountService } from "@/services/account/account.service";

function Stat({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: number }) {
  return (
    <Box
      component={NextLink}
      href={href}
      sx={{ p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, textDecoration: "none", color: "inherit", "&:hover": { boxShadow: 2 } }}
    >
      <Box sx={{ color: "primary.dark", mb: 1 }}>{icon}</Box>
      <Typography variant="h5" component="p">
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

export function AccountOverview() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["account", "dashboard"], queryFn: accountService.dashboard });

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const { profile, counts } = data;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Avatar src={profile.avatar?.sm ?? undefined} sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
          {profile.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" component="h1">
            Hello, {profile.name.split(" ")[0]}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
            {profile.email}
            {profile.phone ? ` · ${profile.phone}` : ""}
          </Typography>
        </Box>
        <LinkButton href={routes.account.profile} variant="outlined" size="small">
          Edit profile
        </LinkButton>
      </Stack>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <Stat href={routes.account.orders} icon={<ReceiptLongOutlinedIcon />} label={`Orders${counts.active_orders ? ` · ${counts.active_orders} in progress` : ""}`} value={counts.orders} />
        <Stat href={routes.account.wishlist} icon={<FavoriteBorderIcon />} label="Wishlist" value={counts.wishlist} />
        <Stat href={routes.account.addresses} icon={<LocationOnOutlinedIcon />} label="Saved addresses" value={counts.addresses} />
        <Stat href={routes.account.reviews} icon={<RateReviewOutlinedIcon />} label="Reviews" value={counts.reviews} />
      </Box>

      <Box>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 1.5 }}>
          <Typography variant="h6" component="h2">
            Recent orders
          </Typography>
          <LinkButton href={routes.account.orders} size="small">
            View all
          </LinkButton>
        </Stack>
        {data.recent_orders.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            You haven&apos;t placed any orders yet.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {data.recent_orders.map((order) => (
              <OrderRow key={order.order_number} order={order} />
            ))}
          </Stack>
        )}
      </Box>

      {data.default_address && (
        <Box sx={{ p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Default delivery address
          </Typography>
          <Typography variant="subtitle2">{data.default_address.name}</Typography>
          {formatAddressLines(data.default_address).map((line) => (
            <Typography key={line} variant="body2" sx={{ color: "text.secondary" }}>
              {line}
            </Typography>
          ))}
        </Box>
      )}
    </Stack>
  );
}
