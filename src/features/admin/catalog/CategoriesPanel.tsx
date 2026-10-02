"use client";

import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { adminCatalogService as api } from "@/services/admin/catalog.service";
import type { AdminCategory } from "@/services/admin/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ListToolbar } from "../components/ListToolbar";
import { Thumb } from "../components/Thumb";
import { useNotify } from "../notify";
import { CategoryAttributesDialog } from "./CategoryAttributesDialog";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { adminKeys, useCategoryMutations } from "./queries";

const LEVEL_SIZE = 100;

type Dialog =
  | { kind: "form"; category?: AdminCategory; parent?: AdminCategory }
  | { kind: "attributes"; category: AdminCategory }
  | { kind: "delete"; category: AdminCategory }
  | null;

interface RowActions {
  open: (dialog: Dialog) => void;
}

/** One level of the tree (roots, or the children of `parentId`), loaded on demand, 100 at a time. */
function useCategoryLevel(parentId: number | null, q?: string) {
  const query = { parent_id: q ? undefined : parentId, q: q || undefined, limit: LEVEL_SIZE, sort: "position" };
  return useInfiniteQuery({
    queryKey: [...adminKeys.categories, "tree", query],
    queryFn: ({ pageParam }) => api.categories({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.has_next_page ? last.pagination.current_page + 1 : undefined),
  });
}

function CategoryLevel({ parentId, depth, actions, q }: { parentId: number | null; depth: number; actions: RowActions; q?: string }) {
  const { data, isLoading, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useCategoryLevel(parentId, q);
  const categories = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) return <Box sx={{ pl: depth * 3, py: 1 }}>{depth === 0 ? <ListSkeleton rows={4} height={52} /> : <Typography variant="caption">Loading…</Typography>}</Box>;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (depth === 0 && categories.length === 0) {
    return <EmptyState title={q ? "No categories match your search" : "No categories yet"} description={q ? undefined : "Add a top-level category such as Clothing, Electronics or Grocery."} />;
  }

  return (
    <>
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} depth={depth} actions={actions} flat={Boolean(q)} />
      ))}
      {hasNextPage && (
        <Box sx={{ pl: depth * 3 + 6, py: 1 }}>
          <Button size="small" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Show more
          </Button>
        </Box>
      )}
    </>
  );
}

function CategoryRow({ category, depth, actions, flat }: { category: AdminCategory; depth: number; actions: RowActions; flat: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { hasPermission } = useAuth();
  const hasChildren = (category.children_count ?? 0) > 0;

  return (
    <>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", py: 1, pr: 1, pl: depth * 3 + 1, borderBottom: 1, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}
      >
        <Box sx={{ width: 32 }}>
          {hasChildren && !flat && (
            <IconButton size="small" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? `Collapse ${category.name}` : `Expand ${category.name}`} aria-expanded={expanded}>
              {expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>
        <Thumb src={category.image?.thumb} alt={category.name} size={36} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {category.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap component="div">
            {flat && category.parent ? `${category.parent.name} › ` : ""}/{category.slug} · {category.products_count ?? 0} products
            {hasChildren ? ` · ${category.children_count} sub-categories` : ""}
          </Typography>
        </Box>
        {!category.is_active && <Chip size="small" label="Hidden" variant="outlined" />}
        <Stack direction="row" sx={{ flexShrink: 0 }}>
          {hasPermission("categories.update") && (
            <Tooltip title="Attributes (product form fields)">
              <IconButton size="small" onClick={() => actions.open({ kind: "attributes", category })} aria-label={`Attributes of ${category.name}`}>
                <TuneOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("categories.create") && (
            <Tooltip title="Add sub-category">
              <IconButton size="small" onClick={() => actions.open({ kind: "form", parent: category })} aria-label={`Add sub-category to ${category.name}`}>
                <CreateNewFolderOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("categories.update") && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => actions.open({ kind: "form", category })} aria-label={`Edit ${category.name}`}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("categories.delete") && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => actions.open({ kind: "delete", category })} aria-label={`Delete ${category.name}`}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      {expanded && <CategoryLevel parentId={category.id} depth={depth + 1} actions={actions} />}
    </>
  );
}

export function CategoriesPanel() {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [dialog, setDialog] = useState<Dialog>(null);
  const { remove } = useCategoryMutations();
  const actions: RowActions = { open: setDialog };

  async function confirmDelete(category: AdminCategory) {
    try {
      await remove.mutateAsync(category.id);
      notify.success("Category deleted.");
    } catch (err) {
      notify.error(err);
    } finally {
      setDialog(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Build any tree (Clothing › Men › Shirts, Electronics › Mobiles…). Use the ⚙ button to choose which attributes products in a category get."
        action={
          hasPermission("categories.create") && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ kind: "form" })}>
              Add category
            </Button>
          )
        }
      />
      <ListToolbar search={search} onSearch={setSearch} placeholder="Search all categories" />
      <Card>
        <CategoryLevel key={q} parentId={null} depth={0} actions={actions} q={q} />
      </Card>

      {dialog?.kind === "form" && (
        <CategoryFormDialog
          category={dialog.category}
          parent={dialog.parent ? { id: dialog.parent.id, label: dialog.parent.name } : null}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "attributes" && <CategoryAttributesDialog category={dialog.category} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title={`Delete ${dialog?.kind === "delete" ? dialog.category.name : "category"}?`}
        description="Only empty categories (no sub-categories, no products) can be deleted."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => dialog?.kind === "delete" && confirmDelete(dialog.category)}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
