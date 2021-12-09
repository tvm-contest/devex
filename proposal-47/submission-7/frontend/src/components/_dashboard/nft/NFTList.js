import PropTypes from 'prop-types';
// material
import { Grid } from '@mui/material';
import NFTCard from './NFTCard';

// ----------------------------------------------------------------------

NFTList.propTypes = {
  nfts: PropTypes.array.isRequired
};

export default function NFTList({ nfts, ...other }) {
  return (
    <Grid container spacing={3} {...other}>
      {nfts.map((nft, id) => (
        <Grid key={id} item xs={12} sm={6} md={3}>
          <NFTCard nft={nft} />
        </Grid>
      ))}
    </Grid>
  );
}
