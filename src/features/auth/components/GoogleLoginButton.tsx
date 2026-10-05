"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { userMessage } from "@/services/api/errors";
import { authService } from "@/services/auth/auth.service";
import { useAuth } from "../AuthProvider";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: "popup" }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/** "Sign in with Google" (Google Identity Services). Renders nothing until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set. */
export function GoogleLoginButton({ onSuccess, text = "signin_with" }: { onSuccess: () => void; text?: "signin_with" | "signup_with" | "continue_with" }) {
  const { startSession } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(() => {
    const google = window.google;
    if (!CLIENT_ID || !google || !container.current) return;

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      ux_mode: "popup",
      callback: async ({ credential }) => {
        setError(null);
        try {
          const { data } = await authService.googleLogin(credential);
          startSession(data);
          onSuccess();
        } catch (err) {
          setError(userMessage(err));
        }
      },
    });
    google.accounts.id.renderButton(container.current, { type: "standard", theme: "outline", size: "large", shape: "rectangular", text, width: Math.min(container.current.offsetWidth || 400, 400) });
  }, [onSuccess, startSession, text]);

  if (!CLIENT_ID) return null;

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={render} />
      {error && <Alert severity="error">{error}</Alert>}
      <Box ref={container} sx={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
      <Divider>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          or
        </Typography>
      </Divider>
    </Stack>
  );
}
