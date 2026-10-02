import SearchOffIcon from "@mui/icons-material/SearchOff";
import Container from "@mui/material/Container";
import { LinkButton } from "@/components/common/LinkButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <EmptyState
        icon={<SearchOffIcon />}
        title="Page not found"
        description="The page you are looking for doesn't exist or may have moved."
        action={
          <LinkButton href={routes.home} variant="contained">
            Back to home
          </LinkButton>
        }
      />
    </Container>
  );
}
