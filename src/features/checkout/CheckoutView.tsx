"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { LinkButton } from "@/components/common/LinkButton";
import { PageContainer } from "@/components/common/PageContainer";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useNotify } from "@/components/feedback/notify";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { FormTextField } from "@/components/forms/FormTextField";
import { routes } from "@/config/routes";
import { AddressFields, addressFieldsSchema, addressToValues, valuesToAddressInput } from "@/features/account/components/AddressFields";
import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import { useAuth } from "@/features/auth/AuthProvider";
import { CouponBox } from "@/features/cart/components/CouponBox";
import { OrderSummary } from "@/features/cart/components/OrderSummary";
import { useCart, useCartKey } from "@/features/cart/hooks";
import { CatalogImage } from "@/features/catalog/components/CatalogImage";
import { formatAddressLines, formatPrice } from "@/lib/format";
import { emailSchema, mobileSchema } from "@/lib/validation";
import { accountService } from "@/services/account/account.service";
import type { Address } from "@/services/account/types";
import { isApiError, userMessage } from "@/services/api/errors";
import { checkoutService } from "@/services/orders/orders.service";
import type { PaymentMethodCode, PlaceOrderInput } from "@/services/orders/types";
import { usePayOnline } from "./usePayOnline";

const guestSchema = z.object({
  email: emailSchema,
  contact_phone: mobileSchema,
  address: addressFieldsSchema,
});
type GuestValues = z.infer<typeof guestSchema>;

function Step({ n, title, done, children, action }: { n: number; title: string; done?: boolean; children: ReactNode; action?: ReactNode }) {
  return (
    <Box component="section" aria-labelledby={`step-${n}`} sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontWeight: 700,
            bgcolor: done ? "primary.main" : "action.selected",
            color: done ? "primary.contrastText" : "text.primary",
          }}
        >
          {done ? "✓" : n}
        </Box>
        <Typography id={`step-${n}`} variant="h6" component="h2" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : `${Date.now()}${Math.random().toString(36).slice(2)}`.padEnd(24, "0");
}

export function CheckoutView() {
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const cartKey = useCartKey();
  const { status, user } = useAuth();
  const authed = status === "authenticated";
  const { data: cart, isLoading: cartLoading, dataUpdatedAt } = useCart();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [addressDialog, setAddressDialog] = useState<Address | "new" | null>(null);
  const [method, setMethod] = useState<PaymentMethodCode | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const idempotencyKey = useRef(newKey());
  const { pay } = usePayOnline();

  const guestForm = useForm<GuestValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: { email: "", contact_phone: "", address: addressToValues() },
  });
  const guestState = useWatch({ control: guestForm.control, name: "address.state_code" });
  const guestEmail = useWatch({ control: guestForm.control, name: "email" });

  const addresses = useQuery({
    queryKey: ["account", "addresses", "checkout"],
    queryFn: () => accountService.addresses({ limit: 20 }).then((r) => r.data),
    enabled: authed,
  });
  const selectedAddress = useMemo(() => {
    const list = addresses.data ?? [];
    return list.find((a) => a.id === addressId) ?? list.find((a) => a.is_default) ?? list[0] ?? null;
  }, [addresses.data, addressId]);

  const summaryBody = authed
    ? { address_id: selectedAddress?.id, payment_method: method ?? undefined }
    : { state_code: guestState || undefined, payment_method: method ?? undefined, email: guestEmail?.includes("@") ? guestEmail : undefined };
  const summary = useQuery({
    queryKey: ["checkout", "summary", summaryBody, dataUpdatedAt],
    queryFn: () => checkoutService.summary(summaryBody),
    enabled: status !== "loading" && Boolean(cart && cart.items.length > 0),
    placeholderData: keepPreviousData,
  });

  const options = summary.data?.payment_methods ?? [];
  const chosen = method ?? options.find((o) => o.available)?.method ?? null;

  async function placeOrder() {
    setPlaceError(null);
    if (!chosen) return setPlaceError("Choose a payment method.");

    let input: PlaceOrderInput;
    if (authed) {
      if (!selectedAddress) return setPlaceError("Add a delivery address.");
      input = { payment_method: chosen, address_id: selectedAddress.id };
    } else {
      const valid = await guestForm.trigger();
      if (!valid) {
        setPlaceError("Please complete your contact details and address.");
        return;
      }
      const values = guestForm.getValues();
      input = {
        payment_method: chosen,
        address: valuesToAddressInput(values.address) as unknown as Record<string, unknown>,
        contact: { name: values.address.name, email: values.email, phone: values.contact_phone },
      };
    }
    input.expected_total = summary.data?.totals?.grand_total;

    setPlacing(true);
    try {
      const result = await checkoutService.placeOrder(input, idempotencyKey.current);
      const number = result.order.order_number;
      void queryClient.invalidateQueries({ queryKey: cartKey });

      if (result.order.status === "payment_pending") {
        const outcome = await pay(number, result.payment);
        if (outcome.status === "failed") notify.error(outcome.message);
      }
      router.replace(routes.orderPlaced(number));
    } catch (error) {
      if (isApiError(error) && error.code === "PRICE_CHANGED") {
        await summary.refetch();
        setPlaceError("Prices changed while you were checking out. Please review the updated total and place the order again.");
      } else if (isApiError(error) && error.isValidation && !authed) {
        for (const [field, messages] of Object.entries(error.errors)) {
          const path = field === "contact.email" ? "email" : field === "contact.phone" ? "contact_phone" : field;
          guestForm.setError(path as keyof GuestValues, { message: messages[0] });
        }
        setPlaceError(error.message);
      } else {
        setPlaceError(userMessage(error));
        void queryClient.invalidateQueries({ queryKey: cartKey });
      }
      idempotencyKey.current = newKey();
    } finally {
      setPlacing(false);
    }
  }

  if (cartLoading || status === "loading") {
    return (
      <PageContainer>
        <ListSkeleton rows={3} height={160} />
      </PageContainer>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageContainer maxWidth="md">
        <EmptyState
          icon={<ShoppingBagOutlinedIcon />}
          title="Your bag is empty"
          description="Add something you love, then come back to check out."
          action={
            <LinkButton href={routes.search()} variant="contained">
              Continue shopping
            </LinkButton>
          }
        />
      </PageContainer>
    );
  }

  const totals = summary.data?.totals ?? cart.totals;
  const blocked = summary.data ? !summary.data.can_checkout : !cart.can_checkout;
  const estimate = summary.data?.delivery_estimate;

  return (
    <PageContainer>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 3 }}>
        <LockOutlinedIcon sx={{ color: "primary.dark" }} />
        <Typography variant="h4" component="h1">
          Secure checkout
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 380px" }, gap: { xs: 3, md: 4 }, alignItems: "start" }}>
        <Stack spacing={2.5}>
          <Step n={1} title={authed ? "Account" : "Contact details"} done={authed}>
            {authed ? (
              <Typography variant="body2">
                Signed in as <strong>{user?.name}</strong> ({user?.email})
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Alert severity="info" action={<LinkButton href={routes.login(routes.checkout)} size="small" color="inherit">Log in</LinkButton>}>
                  Have an account? Log in for saved addresses and order history. Or continue as a guest.
                </Alert>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField control={guestForm.control} name="email" label="Email" type="email" autoComplete="email" required helperText="Order updates are sent here" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField control={guestForm.control} name="contact_phone" label="Mobile number" type="tel" autoComplete="tel-national" required />
                  </Grid>
                </Grid>
              </Stack>
            )}
          </Step>

          <Step
            n={2}
            title="Delivery address"
            done={authed ? Boolean(selectedAddress) : false}
            action={
              authed && (
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAddressDialog("new")}>
                  Add new
                </Button>
              )
            }
          >
            {authed ? (
              addresses.isLoading ? (
                <ListSkeleton rows={2} height={80} />
              ) : (addresses.data ?? []).length === 0 ? (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddressDialog("new")}>
                  Add a delivery address
                </Button>
              ) : (
                <Stack spacing={1.5} role="radiogroup" aria-label="Delivery address">
                  {(addresses.data ?? []).map((address) => {
                    const selected = selectedAddress?.id === address.id;
                    return (
                      <Box
                        key={address.id}
                        onClick={() => setAddressId(address.id)}
                        sx={{ p: 1.5, borderRadius: 3, border: 2, borderColor: selected ? "primary.main" : "divider", cursor: "pointer", display: "flex", gap: 1 }}
                      >
                        <Radio checked={selected} onChange={() => setAddressId(address.id)} slotProps={{ input: { "aria-label": `Deliver to ${address.name}, ${address.city}` } }} sx={{ mt: -0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Typography variant="subtitle2">{address.name}</Typography>
                            <Chip size="small" variant="outlined" label={address.address_type.toUpperCase()} />
                          </Stack>
                          {formatAddressLines(address).map((line) => (
                            <Typography key={line} variant="body2" sx={{ color: "text.secondary" }}>
                              {line}
                            </Typography>
                          ))}
                          <Typography variant="body2">Mobile: {address.phone}</Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddressDialog(address);
                          }}
                        >
                          Edit
                        </Button>
                      </Box>
                    );
                  })}
                </Stack>
              )
            ) : (
              <AddressFields control={guestForm.control} prefix="address." />
            )}
          </Step>

          <Step n={3} title={`Review items (${cart.item_count})`} done={!blocked}>
            <Stack spacing={1.5}>
              {(summary.data?.items ?? cart.items).map((line) => (
                <Stack key={line.variant_id} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 56, flexShrink: 0 }}>
                    <CatalogImage image={line.image} alt={line.product.name} sizes="56px" sx={{ borderRadius: 1.5 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {line.product.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {[...line.options.map((o) => `${o.name}: ${o.value}`), `Qty ${line.quantity}`].join(" · ")}
                    </Typography>
                    {line.issues
                      .filter((i) => i.code !== "PRICE_CHANGED")
                      .map((i) => (
                        <Typography key={i.code} variant="caption" sx={{ color: "warning.main", display: "block" }}>
                          {i.message}
                        </Typography>
                      ))}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(line.line_subtotal)}
                  </Typography>
                </Stack>
              ))}
              {blocked && (
                <Alert severity="warning" action={<LinkButton href={routes.cart} size="small" color="inherit">Edit bag</LinkButton>}>
                  Some items need attention in your bag before you can place the order.
                </Alert>
              )}
              {estimate && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Estimated delivery: {new Date(estimate.min_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                  {new Date(estimate.max_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </Typography>
              )}
            </Stack>
          </Step>

          <Step n={4} title="Apply coupon" done={Boolean(cart.coupon)}>
            <CouponBox cart={cart} />
          </Step>

          <Step n={5} title="Payment method" done={Boolean(chosen)}>
            <Stack spacing={1.5} role="radiogroup" aria-label="Payment method">
              {options.length === 0 && <ListSkeleton rows={2} height={64} />}
              {options.map((option) => {
                const selected = chosen === option.method;
                return (
                  <Box
                    key={option.method}
                    onClick={() => option.available && setMethod(option.method)}
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      border: 2,
                      borderColor: selected ? "primary.main" : "divider",
                      cursor: option.available ? "pointer" : "not-allowed",
                      opacity: option.available ? 1 : 0.55,
                    }}
                  >
                    <FormControlLabel
                      disabled={!option.available}
                      control={<Radio checked={selected} onChange={() => setMethod(option.method)} />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">{option.label}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {option.available ? option.description : option.reason}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                );
              })}
            </Stack>
          </Step>
        </Stack>

        <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
          {totals && (
            <OrderSummary totals={totals} itemCount={cart.item_count} couponCode={cart.coupon?.code}>
              {placeError && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {placeError}
                </Alert>
              )}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={placeOrder}
                loading={placing}
                disabled={blocked || !chosen || summary.isFetching}
                startIcon={<LockOutlinedIcon />}
              >
                {chosen === "cod" ? "Place order" : "Pay"} {formatPrice(totals.grand_total)}
              </Button>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.25, textAlign: "center" }}>
                By placing the order you agree to our terms and return policy.
              </Typography>
            </OrderSummary>
          )}
        </Stack>
      </Box>

      {addressDialog && (
        <AddressFormDialog
          key={addressDialog === "new" ? "new" : addressDialog.id}
          open
          address={addressDialog === "new" ? undefined : addressDialog}
          onClose={() => setAddressDialog(null)}
          onSaved={(saved) => {
            setAddressId(saved.id);
            void addresses.refetch();
          }}
        />
      )}
    </PageContainer>
  );
}
