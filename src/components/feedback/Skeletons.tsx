import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

/** Fixed-size placeholders so content loads without layout shift. */

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Stack spacing={2.5} aria-busy="true" aria-label="Loading">
      {Array.from({ length: fields }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={56} />
      ))}
      <Skeleton variant="rounded" height={44} width={160} />
    </Stack>
  );
}

export function ListSkeleton({ rows = 3, height = 120 }: { rows?: number; height?: number }) {
  return (
    <Stack spacing={2} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={height} />
      ))}
    </Stack>
  );
}

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Box aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <Stack key={r} direction="row" spacing={2} sx={{ py: 1.25, borderBottom: 1, borderColor: "divider" }}>
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} variant="text" sx={{ flex: 1 }} />
          ))}
        </Stack>
      ))}
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card aria-busy="true">
      <Skeleton variant="rectangular" sx={{ aspectRatio: "3 / 4", height: "auto" }} />
      <Box sx={{ p: 1.5 }}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="55%" />
      </Box>
    </Card>
  );
}

export function PageSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Loading">
      <Skeleton variant="text" width={240} height={48} />
      <Skeleton variant="rounded" height={280} />
    </Stack>
  );
}
