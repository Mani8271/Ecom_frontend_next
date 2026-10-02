"use client";

import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { userMessage } from "@/services/api/errors";
import type { Cart } from "@/services/cart/types";
import { useCartActions } from "../hooks";

/** Apply / remove a coupon. Validation messages come from the server. */
export function CouponBox({ cart }: { cart: Cart }) {
  const { applyCoupon, removeCoupon } = useCartActions();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setApplied(null);
    try {
      await applyCoupon.mutateAsync(code.trim());
      setApplied("Coupon applied successfully");
      setCode("");
    } catch (err) {
      setError(userMessage(err));
    }
  }

  return (
    <Box sx={{ p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
        <LocalOfferOutlinedIcon fontSize="small" sx={{ color: "primary.dark" }} />
        <Typography variant="subtitle2">Coupons</Typography>
      </Stack>

      {cart.coupon ? (
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, p: 1.25, borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "primary.main" }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: "primary.dark" }}>
              {cart.coupon.code} applied
            </Typography>
            {cart.coupon.description && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {cart.coupon.description}
              </Typography>
            )}
          </Box>
          <Button size="small" color="error" onClick={() => removeCoupon.mutate()} loading={removeCoupon.isPending}>
            Remove
          </Button>
        </Stack>
      ) : (
        <Stack component="form" onSubmit={submit} direction="row" spacing={1}>
          <TextField
            size="small"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            error={Boolean(error)}
            slotProps={{ htmlInput: { "aria-label": "Coupon code", maxLength: 40, autoCapitalize: "characters" } }}
          />
          <Button type="submit" variant="outlined" loading={applyCoupon.isPending} disabled={!code.trim()}>
            Apply
          </Button>
        </Stack>
      )}
      {error && (
        <Typography variant="caption" role="alert" sx={{ color: "error.main", display: "block", mt: 1 }}>
          {error}
        </Typography>
      )}
      {applied && !error && (
        <Typography variant="caption" sx={{ color: "success.main", display: "block", mt: 1 }}>
          {applied}
        </Typography>
      )}
      {cart.coupon_error && !cart.coupon && (
        <Typography variant="caption" sx={{ color: "warning.main", display: "block", mt: 1 }}>
          {cart.coupon_error.message}
        </Typography>
      )}
    </Box>
  );
}
