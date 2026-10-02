import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Avatar from "@mui/material/Avatar";

/** Square admin thumbnail with a placeholder icon. */
export function Thumb({ src, alt, size = 40 }: { src?: string | null; alt?: string | null; size?: number }) {
  return (
    <Avatar
      variant="rounded"
      src={src ?? undefined}
      alt={alt ?? ""}
      sx={{ width: size, height: size, bgcolor: "action.hover", color: "text.secondary", "& img": { objectFit: "cover" } }}
    >
      <ImageOutlinedIcon fontSize="small" />
    </Avatar>
  );
}
