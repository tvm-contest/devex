import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// material
import { Container, Typography, Grid, Button, Link } from '@mui/material';

// components
import Page from '../components/Page';
import StoreContext from '../store/StoreContext';
import { login } from '../store/actions/account';

// ----------------------------------------------------------------------

export default function Login() {
  const { state, dispatch } = useContext(StoreContext);
  const navigate = useNavigate();
  const { account, ton } = state;

  useEffect(() => {
    if (account.isReady) {
      navigate('/dashboard');
    }
  }, [account.isReady, navigate]);

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
            <Typography variant="h6" sx={{ mb: 2 }}>
              To start working with NeFerTiti you need to connect your TON Crystal Wallet. Click on
              the button below and have fun!
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              If you still haven't Crystal Wallet you can get it
              <Link
                href="https://l1.broxus.com/everscale/wallet?utm_source=freeton.com&utm_medium=organic&utm_campaign=ecosystem"
                target="_blank"
                underline="none"
              >
                {` here >>> `}
              </Link>
            </Typography>
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
