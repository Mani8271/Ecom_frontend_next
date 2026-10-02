import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <Card sx={{ width: "100%" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ mt: 3 }}>{children}</Box>
        {footer && (
          <Typography variant="body2" component="div" sx={{ mt: 3, textAlign: "center", color: "text.secondary" }}>
            {footer}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
