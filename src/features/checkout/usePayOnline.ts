"use client";

import { useTheme } from "@mui/material/styles";
import { useCallback, useState } from "react";
import { openRazorpay, PaymentDismissedError } from "@/lib/razorpay";
import { userMessage } from "@/services/api/errors";
import { ordersService } from "@/services/orders/orders.service";
import type { Order, PaymentInit } from "@/services/orders/types";

type PayResult = { status: "paid"; order: Order } | { status: "dismissed" } | { status: "failed"; message: string };

/** Open the gateway and verify the result on the server. The browser never decides "paid". */
export function usePayOnline() {
  const theme = useTheme();
  const [pending, setPending] = useState(false);

  const pay = useCallback(
    async (orderNumber: string, payment: PaymentInit | null): Promise<PayResult> => {
      setPending(true);
      try {
        const init = payment && !payment.error ? payment : await ordersService.retryPayment(orderNumber);
        if (init.gateway !== "razorpay" || !init.order_id) {
          return { status: "failed", message: init.error ?? "Online payment is not available right now." };
        }
        const response = await openRazorpay(init, theme.palette.primary.main);
        const order = await ordersService.verifyPayment(orderNumber, response);
        return { status: "paid", order };
      } catch (error) {
        if (error instanceof PaymentDismissedError) return { status: "dismissed" };
        return { status: "failed", message: error instanceof Error && !("status" in error) ? error.message : userMessage(error) };
      } finally {
        setPending(false);
      }
    },
    [theme.palette.primary.main],
  );

  return { pay, pending };
}
