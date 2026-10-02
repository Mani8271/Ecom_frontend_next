"use client";

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { userMessage } from "@/services/api/errors";
import { reviewsService, type Review } from "@/services/catalog/reviews.service";

const LABELS: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent" };
const MAX_PHOTOS = 5;

/** Write or edit a review (verified buyers only; the API enforces it). */
export function ReviewDialog({ slug, productName, review, onClose, onSaved }: { slug: string; productName: string; review?: Review | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [rating, setRating] = useState<number | null>(review?.rating ?? null);
  const [title, setTitle] = useState(review?.title ?? "");
  const [body, setBody] = useState(review?.body ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const existing = (review?.images ?? []).filter((img) => !removed.includes(img.id));

  async function submit() {
    if (!rating) return setError("Choose a star rating.");
    setPending(true);
    setError(null);
    const form = new FormData();
    form.append("rating", String(rating));
    form.append("title", title.trim());
    form.append("body", body.trim());
    photos.forEach((file) => form.append("images[]", file));
    removed.forEach((id) => form.append("remove_image_ids[]", String(id)));
    try {
      const response = review ? await reviewsService.update(review.id, form) : await reviewsService.create(slug, form);
      onSaved(response.message ?? "Thanks for your review!");
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="review-title">
      <DialogTitle id="review-title">{review ? "Edit your review" : "Rate this product"}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {productName}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <Rating value={rating} onChange={(_, v) => setRating(v)} size="large" aria-label="Rating" />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {rating ? LABELS[rating] : "Tap to rate"}
          </Typography>
        </Stack>
        <TextField label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} sx={{ mb: 2 }} />
        <TextField
          label="Your review (optional)"
          placeholder="What did you like or dislike? How was the fit, fabric and quality?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          multiline
          minRows={4}
          slotProps={{ htmlInput: { maxLength: 3000 } }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", alignItems: "center" }}>
          {existing.map((img) => (
            <Box key={img.id} sx={{ position: "relative" }}>
              <Avatar variant="rounded" src={img.thumb ?? undefined} sx={{ width: 64, height: 64 }} />
              <IconButton size="small" aria-label="Remove photo" onClick={() => setRemoved((r) => [...r, img.id])} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper" }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
          {photos.map((file, i) => (
            <Box key={`${file.name}-${i}`} sx={{ position: "relative" }}>
              <Avatar variant="rounded" src={URL.createObjectURL(file)} sx={{ width: 64, height: 64 }} />
              <IconButton size="small" aria-label="Remove photo" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper" }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
          {existing.length + photos.length < MAX_PHOTOS && (
            <Button size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => input.current?.click()}>
              Add photos
            </Button>
          )}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              setPhotos((p) => [...p, ...Array.from(e.target.files ?? [])].slice(0, MAX_PHOTOS - existing.length));
              e.target.value = "";
            }}
          />
        </Stack>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
          Reviews are checked before they appear. Please don&apos;t include personal details.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} loading={pending} disabled={!rating}>
          {review ? "Save changes" : "Submit review"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
