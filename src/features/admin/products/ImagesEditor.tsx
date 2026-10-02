"use client";

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LinkIcon from "@mui/icons-material/Link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { userMessage } from "@/services/api/errors";
import type { AdminProduct, Media } from "@/services/admin/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ACCEPTED_IMAGES } from "../components/ImageUploadField";
import { useNotify } from "../notify";
import { useProductEditor } from "./queries";

const MAX_IMAGES = 100;

function imageUrl(media: Media): string | undefined {
  return media.urls.md ?? media.urls.sm ?? media.urls.original ?? undefined;
}

export function ImagesEditor({ product }: { product: AdminProduct }) {
  const gallery = product.media.filter((m) => m.collection === "gallery" || m.collection === "main");
  const editor = useProductEditor(product.id);
  const notify = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [assigning, setAssigning] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState<Media | null>(null);

  const saving = Boolean(progress) || editor.reorderImages.isPending || editor.deleteImage.isPending;

  const linkedCount = (mediaId: number) => product.variants.filter((v) => v.media_ids.includes(mediaId)).length;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, MAX_IMAGES - gallery.length);
    const failures: string[] = [];
    setErrors([]);
    setProgress({ done: 0, total: list.length });

    // One at a time: keeps the order and the server load predictable.
    for (const [index, file] of list.entries()) {
      try {
        await editor.uploadImage.mutateAsync({ file });
      } catch (err) {
        failures.push(`${file.name}: ${userMessage(err)}`);
      }
      setProgress({ done: index + 1, total: list.length });
    }

    setProgress(null);
    setErrors(failures);
    if (input.current) input.current.value = "";
    if (failures.length < list.length) notify.success(`${list.length - failures.length} image${list.length - failures.length === 1 ? "" : "s"} uploaded.`);
  }

  async function move(index: number, to: number) {
    const ids = gallery.map((m) => m.id);
    const [id] = ids.splice(index, 1);
    ids.splice(to, 0, id);
    try {
      await editor.reorderImages.mutateAsync(ids);
    } catch (err) {
      notify.error(err);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await editor.deleteImage.mutateAsync(deleting.id);
      notify.success("Image deleted.");
    } catch (err) {
      notify.error(err);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              Images ({gallery.length})
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Changes save automatically: uploads, order and deletes need no Save button. The first image is the main image. JPG, PNG, WebP or AVIF up
              to 5 MB.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} role="status" aria-live="polite" sx={{ alignItems: "center", color: saving ? "text.secondary" : "success.main" }}>
            {saving ? <CircularProgress size={16} color="inherit" /> : <CloudDoneOutlinedIcon fontSize="small" />}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {saving ? "Saving…" : "All changes saved"}
            </Typography>
          </Stack>
          <Button variant="contained" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => input.current?.click()} disabled={Boolean(progress) || gallery.length >= MAX_IMAGES}>
            Upload images
          </Button>
          <input ref={input} type="file" accept={ACCEPTED_IMAGES} multiple hidden onChange={(e) => upload(e.target.files)} />
        </Stack>

        {progress && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption">
              Uploading {progress.done} / {progress.total}…
            </Typography>
            <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} />
          </Box>
        )}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors([])}>
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </Alert>
        )}

        {gallery.length === 0 ? (
          <EmptyState icon={<AddPhotoAlternateOutlinedIcon />} title="No images yet" description="Products with clear photos from several angles sell much better." />
        ) : (
          <Grid container spacing={2}>
            {gallery.map((media, index) => {
              const linked = linkedCount(media.id);
              return (
                <Grid key={media.id} size={{ xs: 6, sm: 4, md: 3, xl: 2 }}>
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
                    <Box sx={{ position: "relative", aspectRatio: "3 / 4", bgcolor: "action.hover" }}>
                      <Box component="img" src={imageUrl(media)} alt={media.alt ?? ""} loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <Stack direction="row" spacing={0.5} sx={{ position: "absolute", top: 8, left: 8 }}>
                        {index === 0 && <Chip size="small" color="primary" label="Main" />}
                        {linked > 0 && <Chip size="small" label={`${linked} variant${linked === 1 ? "" : "s"}`} sx={{ bgcolor: "background.paper" }} />}
                      </Stack>
                    </Box>
                    <Stack direction="row" sx={{ justifyContent: "space-between", px: 0.5, py: 0.25 }}>
                      <Box>
                        <IconButton size="small" disabled={index === 0 || editor.reorderImages.isPending} onClick={() => move(index, index - 1)} aria-label="Move earlier">
                          <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" disabled={index === gallery.length - 1 || editor.reorderImages.isPending} onClick={() => move(index, index + 1)} aria-label="Move later">
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box>
                        {product.variants.length > 1 && (
                          <Tooltip title="Show for specific variants">
                            <IconButton size="small" onClick={() => setAssigning(media)} aria-label="Link to variants">
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleting(media)} aria-label="Delete image">
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>

      {assigning && <AssignDialog product={product} media={assigning} onClose={() => setAssigning(null)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this image?"
        confirmLabel="Delete"
        destructive
        pending={editor.deleteImage.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}

/** Link an image to variants, e.g. every "Black" variant, so the product page swaps photos with the color. */
function AssignDialog({ product, media, onClose }: { product: AdminProduct; media: Media; onClose: () => void }) {
  const [selected, setSelected] = useState<number[]>(() => product.variants.filter((v) => v.media_ids.includes(media.id)).map((v) => v.id));
  const { assignImage } = useProductEditor(product.id);
  const notify = useNotify();
  const firstAxis = product.variant_axes[0];

  // Quick picks by the first axis value (usually Color).
  const groups = new Map<number, { label: string; ids: number[] }>();
  if (firstAxis) {
    for (const variant of product.variants) {
      const option = variant.options.find((o) => o.attribute_id === firstAxis.id);
      if (!option) continue;
      const group = groups.get(option.option_id) ?? { label: option.label, ids: [] };
      group.ids.push(variant.id);
      groups.set(option.option_id, group);
    }
  }

  const toggle = (ids: number[], on: boolean) => setSelected((current) => (on ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id))));

  async function save() {
    try {
      await assignImage.mutateAsync({ mediaId: media.id, variantIds: selected });
      notify.success("Image links saved.");
      onClose();
    } catch (err) {
      notify.error(err);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="assign-dialog-title">
      <DialogTitle id="assign-dialog-title">Show this image for…</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          When a shopper picks one of these variants, this image is shown. Leave all unchecked to show it for every variant.
        </Typography>
        {groups.size > 1 && (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
            {[...groups.values()].map((group) => {
              const all = group.ids.every((id) => selected.includes(id));
              return (
                <Chip
                  key={group.label}
                  label={`All ${group.label}`}
                  color={all ? "primary" : "default"}
                  variant={all ? "filled" : "outlined"}
                  onClick={() => toggle(group.ids, !all)}
                />
              );
            })}
          </Stack>
        )}
        <Stack sx={{ maxHeight: 360, overflowY: "auto" }}>
          {product.variants.map((variant) => (
            <FormControlLabel
              key={variant.id}
              control={<Checkbox size="small" checked={selected.includes(variant.id)} onChange={(e) => toggle([variant.id], e.target.checked)} />}
              label={`${variant.title || "Default"} · ${variant.sku}`}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} loading={assignImage.isPending}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
