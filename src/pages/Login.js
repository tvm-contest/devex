import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// material
import { Container, Typography, Grid, Button } from '@mui/material';

// components
import Page from '../components/Page';
import StoreContext from '../store/StoreContext';
import { login } from '../store/actions/account';

// ----------------------------------------------------------------------

export default function Login() {
  const { state, dispatch } = useContext(StoreContext);
  const navigate = useNavigate();
  const { account, ton } = state;

  if (account.isReady) {
    navigate('/dashboard');
    return '';
  }

  const onButtonClick = () => {
    login(state, dispatch);
  };

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
          {ton.isReady && (
            <Grid item xs={12}>
              <Button fullWidth variant="contained" onClick={onButtonClick}>
                Connect
              </Button>
            </Grid>
          )}
        </Grid>
      </Container>
    </Page>
  );
}
