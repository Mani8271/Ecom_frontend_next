import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatDateTime } from "@/lib/format";
import type { Tracking } from "@/services/orders/types";

/**
 * ✓ Placed ✓ Confirmed ✓ Packed ● Shipped ○ Delivered — from the stored
 * status history; cancelled/returned orders show their own events.
 */
export function TrackingTimeline({ tracking }: { tracking: Tracking }) {
  const offTrack = ["cancelled", "payment_pending", "return_requested", "returned", "refunded"].includes(tracking.current_status);

  return (
    <Box>
      <Stack component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {tracking.steps.map((step, index) => {
          const done = step.state === "done";
          const current = step.state === "current";
          const last = index === tracking.steps.length - 1;
          return (
            <Stack key={step.status} component="li" direction="row" spacing={2} aria-current={current ? "step" : undefined}>
              <Stack sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: done ? "primary.main" : "background.paper",
                    color: "primary.contrastText",
                    border: 2,
                    borderColor: done || current ? "primary.main" : "divider",
                  }}
                >
                  {done ? <CheckIcon sx={{ fontSize: 16 }} /> : current ? <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} /> : null}
                </Box>
                {!last && <Box sx={{ width: 2, flex: 1, minHeight: 28, bgcolor: done ? "primary.main" : "divider" }} />}
              </Stack>
              <Box sx={{ pb: last ? 0 : 2 }}>
                <Typography variant="subtitle2" sx={{ color: done || current ? "text.primary" : "text.secondary", fontWeight: current ? 700 : 600 }}>
                  {step.label}
                </Typography>
                {step.at && (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatDateTime(step.at)}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>

      {offTrack && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
          <Typography variant="subtitle2">{tracking.current_label}</Typography>
        </Box>
      )}

      {tracking.events.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Order history
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {tracking.events.map((event, i) => (
              <Stack key={`${event.status}-${i}`} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event.label}
                  </Typography>
                  {event.comment && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {event.comment}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                  {formatDateTime(event.at)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
