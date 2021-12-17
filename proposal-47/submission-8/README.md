# NFTCollectibles

### Architecture
General information about the collection is stored in the root contract. Each picture is stored in a separate contract. Each picture belongs to a specific layer and has a unique number. There can be up to 256 layers in a collection, each layer can contain 256 pictures. The token stores information about which pictures it belongs to.

![scheme](img/scheme.png)

### Configuration

Please use compiler version 0.47.0

`config/deploy_config.js` contain config information

`config/owner_msig.keys.js` contain keys for owner wallet

### NPM Commands

`npm install` – download required modules

`npm run build` – build contracts. Please use compiler version 0.47.0

`npm run build_debot` – build debot. Please use compiler version 0.47.0

`npm run test` – run tests. Please set proper config

`npm run deploy` – deploy contracts and check it integrity

`npm run deploy_debot` – deploy DeBot

### How to try

Demo contracts are deploy to main net

Your can check DeBot

NFT CATS

https://uri.ton.surf/debot/0:d553e69472f8c42141e085c017d98ec07f78377514241570adfeda6346467017

### How to deploy your own collection

1 clone repository

2 run npm install

3 Go to config/deploy_config.js and configure your images

4 Go to config/owner_wallet.keys.js and set your keys

5 Run npm run test in localnode and check that everything is good

6 Run npm run deploy 

8 configure debot/deploy_debot.sh set nftRoot address and nftRoot public key and giver properties

9 run npm run deploy_debot

10 Enjoy your collection

### TODO
- Improve DeBot
- Merge images in DeBot and show result to user
- Try to store Token information about layers in TvmCell

### Contacts
`Telegram` @freetonsurfer

`Surf` 0:299c9cfcc59064679c2a580223a85d42f9f7b453e28abc781b45d45a99386722
