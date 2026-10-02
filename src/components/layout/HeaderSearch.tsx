"use client";

import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/config/routes";

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q) router.push(routes.search(q));
  }

  return (
    <form role="search" onSubmit={submit} style={{ width: "100%" }}>
      <TextField
        size="small"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for sarees, shirts, brands…"
        aria-label="Search products"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { maxLength: 100, enterKeyHint: "search" },
        }}
        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "grey.100" } }}
      />
    </form>
  );
}
