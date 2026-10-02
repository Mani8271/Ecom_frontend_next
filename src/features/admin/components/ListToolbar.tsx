"use client";

import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";

/** Search box + optional filter controls above an admin table. */
export function ListToolbar({ search, onSearch, placeholder = "Search", children }: { search: string; onSearch: (value: string) => void; placeholder?: string; children?: ReactNode }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
      <TextField
        size="small"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        sx={{ maxWidth: { md: 360 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { "aria-label": placeholder, maxLength: 100 },
        }}
      />
      {children}
    </Stack>
  );
}
