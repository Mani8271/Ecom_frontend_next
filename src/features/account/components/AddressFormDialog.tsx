"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { applyServerErrors } from "@/lib/forms";
import type { Address } from "@/services/account/types";
import { useAddressMutations } from "../hooks";
import { ADDRESS_FIELDS, AddressFields, addressFieldsSchema, addressToValues, valuesToAddressInput } from "./AddressFields";

const addressSchema = addressFieldsSchema.extend({ is_default: z.boolean() });
type AddressValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  open: boolean;
  address?: Address;
  onClose: () => void;
  /** Called with the saved address (checkout selects it). */
  onSaved?: (address: Address) => void;
}

export function AddressFormDialog({ open, address, onClose, onSaved }: AddressFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { save } = useAddressMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { ...addressToValues(address), is_default: address?.is_default ?? false },
  });

  const onSubmit = handleSubmit(async ({ is_default, ...values }) => {
    setFormError(null);
    try {
      const { data } = await save.mutateAsync({ id: address?.id, input: { ...valuesToAddressInput(values), is_default } });
      onSaved?.(data);
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ADDRESS_FIELDS));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" aria-labelledby="address-dialog-title">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="address-dialog-title">{address ? "Edit address" : "Add a new address"}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <div style={{ paddingTop: 8 }}>
            <AddressFields control={control} />
          </div>
          <Controller
            control={control}
            name="is_default"
            render={({ field }) => (
              <FormControlLabel
                sx={{ mt: 1.5 }}
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} disabled={address?.is_default} />}
                label="Make this my default address"
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose}>Cancel</Button>
          <SubmitButton pending={formState.isSubmitting} size="medium">
            Save address
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
