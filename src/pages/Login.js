// material
import { Container, Typography, Grid, Button } from '@mui/material';

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
        <Grid container spacing={3}>
          <Grid item xs={12}>
            Here description and link to
            https://chrome.google.com/webstore/detail/ton-crystal-wallet/cgeeodpfagjceefieflmdfphplkenlfk
          </Grid>
          <Grid item xs={12}>
            <Button fullWidth variant="contained">
              Connect
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}
