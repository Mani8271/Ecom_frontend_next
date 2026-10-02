"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import UploadIcon from "@mui/icons-material/FileUploadOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { userMessage } from "@/services/api/errors";
import { adminCatalogService as api } from "@/services/admin/catalog.service";
import { Thumb } from "./Thumb";

export interface UploadedImage {
  id: number;
  url: string | null;
}

export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/avif";

/** Uploads to /admin/media and reports the new media id (saved with the parent form). */
export function ImageUploadField({ label, value, onChange }: { label: string; value: UploadedImage | null; onChange: (value: UploadedImage | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const { data } = await api.uploadImage(file);
      onChange({ id: data.id, url: data.urls.sm ?? data.urls.original ?? null });
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Thumb src={value?.url} size={72} />
        <Button variant="outlined" startIcon={<UploadIcon />} loading={pending} onClick={() => input.current?.click()}>
          {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <IconButton aria-label={`Remove ${label.toLowerCase()}`} onClick={() => onChange(null)}>
            <DeleteOutlineIcon />
          </IconButton>
        )}
        <input ref={input} type="file" accept={ACCEPTED_IMAGES} hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </Stack>
      {error && (
        <Typography variant="caption" sx={{ color: "error.main" }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
