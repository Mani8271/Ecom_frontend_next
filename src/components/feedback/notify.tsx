"use client";

import Alert, { type AlertColor } from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import NextLink from "next/link";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { userMessage } from "@/services/api/errors";

interface NoticeAction {
  label: string;
  href: string;
}

interface Notice {
  key: number;
  message: string;
  severity: AlertColor;
  action?: NoticeAction;
}

interface NotifyContextValue {
  success: (message: string, action?: NoticeAction) => void;
  error: (errorOrMessage: unknown) => void;
}

const NotifyContext = createContext<NotifyContextValue | null>(null);

/** App-wide snackbar feedback ("Added to bag", API error messages). */
export function NotifyProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const show = useCallback((message: string, severity: AlertColor, action?: NoticeAction) => setNotice({ key: Date.now(), message, severity, action }), []);

  const value = useMemo<NotifyContextValue>(
    () => ({
      success: (message, action) => show(message, "success", action),
      error: (error) => show(typeof error === "string" ? error : userMessage(error), "error"),
    }),
    [show],
  );

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        key={notice?.key}
        open={Boolean(notice)}
        autoHideDuration={notice?.severity === "error" ? 6000 : 3500}
        onClose={(_, reason) => reason !== "clickaway" && setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice?.severity ?? "info"}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: "100%", alignItems: "center" }}
          action={
            notice?.action ? (
              <Button color="inherit" size="small" component={NextLink} href={notice.action.href} onClick={() => setNotice(null)} sx={{ fontWeight: 700 }}>
                {notice.action.label}
              </Button>
            ) : undefined
          }
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export function useNotify(): NotifyContextValue {
  const context = useContext(NotifyContext);
  if (!context) throw new Error("useNotify must be used inside <NotifyProvider>");
  return context;
}
