#  NFT_collection_distributor
## How to use
1. Clone repository
2. Run `npm install`
3. Go to */src/config/everscale-settings.ts* and set your parameters
4. Run `npm run build`
5. Run `npm run start`
6. Go to *http://localhost:3001/root-contract-form* and configure your future collection settings
7. Press Deploy Contracts button
8. You will Get Deployed Collection and Debot Addresses
9. Source code of your configured Collection and Debot you can find at */results/collections* folder at the folder with the same name as an address of your collection

## How to run tests
Execute `python -m unittest -v` from */src/contracts/tests* (TestSuite4 required)