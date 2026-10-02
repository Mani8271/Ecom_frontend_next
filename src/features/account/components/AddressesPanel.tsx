"use client";

import AddIcon from "@mui/icons-material/Add";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { userMessage } from "@/services/api/errors";
import type { Address } from "@/services/account/types";
import { useAddresses, useAddressMutations } from "../hooks";
import { AddressCard } from "./AddressCard";
import { AddressFormDialog } from "./AddressFormDialog";

type DialogState = { mode: "closed" } | { mode: "form"; address?: Address } | { mode: "delete"; address: Address };

export function AddressesPanel() {
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const { data, isPending, isError, error, refetch, isFetching } = useAddresses(page);
  const { remove, makeDefault } = useAddressMutations();
  const actionError = remove.error ?? makeDefault.error;
  const close = () => setDialog({ mode: "closed" });

  if (isPending) return <ListSkeleton rows={2} height={180} />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const addresses = data.data;

  return (
    <Stack spacing={3}>
      {actionError && <Alert severity="error">{userMessage(actionError)}</Alert>}

      {addresses.length === 0 ? (
        <EmptyState
          icon={<LocationOnOutlinedIcon />}
          title="No saved addresses"
          description="Save an address for faster checkout."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: "form" })}>
              Add address
            </Button>
          }
        />
      ) : (
        <>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog({ mode: "form" })} sx={{ alignSelf: "flex-start" }}>
            Add address
          </Button>
          <Grid container spacing={2} sx={{ opacity: isFetching ? 0.6 : 1 }}>
            {addresses.map((address) => (
              <Grid key={address.id} size={{ xs: 12, md: 6 }}>
                <AddressCard
                  address={address}
                  busy={remove.isPending || makeDefault.isPending}
                  onEdit={() => setDialog({ mode: "form", address })}
                  onDelete={() => setDialog({ mode: "delete", address })}
                  onMakeDefault={() => makeDefault.mutate(address.id)}
                />
              </Grid>
            ))}
          </Grid>
          {data.pagination.last_page > 1 && (
            <Pagination count={data.pagination.last_page} page={page} onChange={(_, value) => setPage(value)} sx={{ alignSelf: "center" }} />
          )}
        </>
      )}

      <AddressFormDialog
        key={dialog.mode === "form" ? (dialog.address?.id ?? "new") : "closed"}
        open={dialog.mode === "form"} address={dialog.mode === "form" ? dialog.address : undefined} onClose={close} />

      <Dialog open={dialog.mode === "delete"} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this address?</DialogTitle>
        <DialogContent>{dialog.mode === "delete" && `${dialog.address.name}, ${dialog.address.line1}, ${dialog.address.city}`}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={close}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            loading={remove.isPending}
            onClick={() => dialog.mode === "delete" && remove.mutate(dialog.address.id, { onSuccess: close })}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
