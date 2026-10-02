"use client";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Button from "@mui/material/Button";
import { userMessage } from "@/services/api/errors";
import { EmptyState } from "./EmptyState";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={<ErrorOutlineIcon color="error" />}
      title={title}
      description={userMessage(error)}
      action={
        onRetry && (
          <Button variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}
