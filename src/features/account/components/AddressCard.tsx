"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatAddressLines } from "@/lib/format";
import type { Address } from "@/services/account/types";

const TYPE_LABELS = { home: "Home", work: "Work", other: "Other" } as const;

interface AddressCardProps {
  address: Address;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
}

export function AddressCard({ address, busy, onEdit, onDelete, onMakeDefault }: AddressCardProps) {
  const lines = formatAddressLines(address);

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderColor: address.is_default ? "primary.main" : "divider" }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1">{address.name}</Typography>
          <Chip size="small" label={address.label || TYPE_LABELS[address.address_type]} variant="outlined" />
          {address.is_default && <Chip size="small" label="Default" color="primary" />}
        </Stack>
        {lines.map((line) => (
          <Typography key={line} variant="body2" sx={{ color: "text.secondary" }}>
            {line}
          </Typography>
        ))}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Mobile: {address.phone}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" onClick={onEdit} disabled={busy}>
          Edit
        </Button>
        <Button size="small" color="error" onClick={onDelete} disabled={busy}>
          Delete
        </Button>
        {!address.is_default && (
          <Button size="small" onClick={onMakeDefault} disabled={busy} sx={{ ml: "auto" }}>
            Set as default
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
