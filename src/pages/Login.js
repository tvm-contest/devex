// material
import { Container, Typography } from '@mui/material';
// components
import Page from '../components/Page';

// ----------------------------------------------------------------------

export default function Login() {
  return (
    <Page title="Login">
      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Login
        </Typography>
      </Container>
    </Page>
  );
}
