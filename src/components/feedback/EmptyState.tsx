import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      role="status"
      sx={{
        textAlign: "center",
        py: 6,
        px: 2,
        border: 1,
        borderColor: "divider",
        borderStyle: "dashed",
        borderRadius: 4,
        bgcolor: "background.paper",
      }}
    >
      {icon && <Box sx={{ color: "text.secondary", mb: 1.5, "& svg": { fontSize: 40 } }}>{icon}</Box>}
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75, maxWidth: 420, mx: "auto" }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}
