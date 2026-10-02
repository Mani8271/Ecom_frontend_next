"use client";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface QuantitySelectorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "small" | "medium";
  label?: string;
}

/** − 2 + stepper, bounded by stock and the per-order limit. */
export function QuantitySelector({ value, max, onChange, disabled, size = "medium", label = "Quantity" }: QuantitySelectorProps) {
  const dim = size === "small" ? 32 : 40;

  return (
    <Stack
      direction="row"
      role="group"
      aria-label={label}
      sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, width: "fit-content", bgcolor: "background.paper" }}
    >
      <IconButton size="small" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity" sx={{ width: dim, height: dim }}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography component="span" aria-live="polite" sx={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>
        {value}
      </Typography>
      <IconButton size="small" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity" sx={{ width: dim, height: dim }}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
