"use client";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { userMessage } from "@/services/api/errors";
import { accountService } from "@/services/account/account.service";
import type { User } from "@/services/auth/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

export function AvatarUploader({ user }: { user: User }) {
  const { setUser } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(task: () => Promise<{ data: User }>) {
    setBusy(true);
    setError(null);
    try {
      setUser((await task()).data);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError("Please choose a JPEG, PNG, WebP or AVIF image.");
    if (file.size > MAX_BYTES) return setError("Please choose an image smaller than 5 MB.");
    void run(() => accountService.uploadAvatar(file));
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
        <Avatar src={user.avatar?.sm ?? undefined} alt={user.name} sx={{ width: 72, height: 72, fontSize: 28, bgcolor: "primary.main", color: "primary.contrastText" }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={() => input.current?.click()} loading={busy}>
              {user.avatar ? "Change photo" : "Upload photo"}
            </Button>
            {user.avatar && (
              <Button size="small" color="error" onClick={() => run(accountService.deleteAvatar)} disabled={busy}>
                Remove
              </Button>
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            JPEG, PNG or WebP, up to 5 MB.
          </Typography>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <input ref={input} type="file" accept={ACCEPTED.join(",")} hidden onChange={onFile} />
    </Stack>
  );
}
