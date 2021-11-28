import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// material
import { Container, Typography } from '@mui/material';
// components
import Page from '../components/Page';

import StoreContext from '../store/StoreContext';
//

// ----------------------------------------------------------------------

export default function CreateNFT() {
  const navigate = useNavigate();

  const {
    state: { account }
  } = useContext(StoreContext);

  useEffect(() => {
    if (!account.isReady) {
      navigate('/dashboard/login');
    }
  }, [account.isReady, navigate]);

  return (
    <Page title="Create you new Nft">
      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Create a new NFTs
        </Typography>
      </Container>
    </Page>
  );
}
