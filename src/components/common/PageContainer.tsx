import Container, { type ContainerProps } from "@mui/material/Container";

/** Standard page width and vertical rhythm. */
export function PageContainer({ children, sx, ...props }: ContainerProps) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, ...sx }} {...props}>
      {children}
    </Container>
  );
}
