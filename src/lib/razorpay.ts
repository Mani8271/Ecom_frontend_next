"use client";

import type { PaymentInit } from "@/services/orders/types";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<RazorpayConstructor> | null = null;

/** Loads Razorpay Checkout on demand (only when the customer pays online). */
function loadRazorpay(): Promise<RazorpayConstructor> {
  const existing = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (existing) return Promise.resolve(existing);

  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      const ctor = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
      if (ctor) resolve(ctor);
      else reject(new Error("Payment window failed to load."));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return loading;
}

export class PaymentDismissedError extends Error {
  constructor() {
    super("Payment was not completed.");
    this.name = "PaymentDismissedError";
  }
}

/**
 * Opens the payment window. Resolves with the gateway's signed response,
 * which must be verified by the server; rejects if the customer closes it.
 */
export async function openRazorpay(payment: PaymentInit, themeColor: string): Promise<RazorpaySuccess> {
  const Razorpay = await loadRazorpay();

  return new Promise((resolve, reject) => {
    let settled = false;
    const instance = new Razorpay({
      key: payment.key_id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.name,
      description: payment.description,
      prefill: payment.prefill,
      theme: { color: themeColor },
      handler: (response: RazorpaySuccess) => {
        settled = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject(new PaymentDismissedError());
        },
      },
    });
    instance.on("payment.failed", (response) => {
      settled = true;
      reject(new Error(response.error?.description ?? "Payment failed. Please try again."));
    });
    instance.open();
  });
}
