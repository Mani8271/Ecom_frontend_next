"use client";

import Container from "@mui/material/Container";
import { ErrorState } from "@/components/feedback/ErrorState";

/** Route-level error boundary. Never shows internals: userMessage() sanitizes. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <ErrorState error={error} onRetry={reset} />
    </Container>
  );
}
