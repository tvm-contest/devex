// material
import { Box, Grid, Container, Typography, Link } from '@mui/material';
// components
import Page from '../components/Page';

// ----------------------------------------------------------------------

export default function DashboardAppNFT() {
  return (
    <Page title="Dashboard | Minimal-UI">
      <Container maxWidth="xl">
        <Box sx={{ pb: 5 }}>
          <Typography variant="h4">Hi, and welcome</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Create your own NFT collections in a few clicks!
              <Link
                href="https://drive.google.com/file/d/1mXScyRSkHIfHR_J3KExNLa4bL0da483j/view?usp=sharing"
                target="_blank"
                underline="none"
              >
                {` WhitePaper >>> `}
              </Link>
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              To create new collection select menu item "New NFT". There you can upload your images
              to generate new NFTs.
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              All you needed is your own images in .png format, pre-drawn in any common graphic
              editor.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}
