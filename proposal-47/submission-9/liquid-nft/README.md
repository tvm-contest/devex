# NFT collection distributor generative art contest

`Author`: Anton Platonov

`Telegram`: @SuperArmor

`Wallet Address`: 0:cba39007bdb0f025aac0609b25e96a7d2153f06d22fa47b5f6c26cf756b8b2d6

`[devnet] DeBot address`: 0:af94ef6c298f00fc74f633c0bc22de53ad24b15624661d8a6e8db2da21b956c1

`[devnet] Distributor address`: 0:c7a81f2d3a410e6e0f1b4481cd672f499b1c1f7dffd1432e700215b7435c2d56

`[devnet] Root token wallet address`: 0:512781620cabfceea0312f848d424f0dd9dc46b14e470e63c7f5744fd6b4bade

`Code:` https://github.com/SolderingArmor/liquid-nft

## Description

Please refer to `STANDARD.md` file.

## Entities

### LiquidNFT

`LiquidNFT` - Contract that represents a single non-fungible `Token`. Following distributed programming paradigm, one `Token` is one contract. `Token` stores general information and metadata in JSON format. Metadata is always stored on-chain.

`Token` can be of two different types: `Master Edition + Print` and `Normal NFT`.

#### Master Edition

A `Master Edition` token, when minted, represents both a non-fungible token on Everscale and metadata that allows creators to control the provenance of prints created from the master edition.

Rights to create prints are tokenized itself, and the owner of the `Collection` can distribute tokens that allow users to create prints from master editions. Additionally, the creator can set the max supply of the master edition just like a regular mint on Everscale, with the main difference being that each print is a numbered edition created from it.

A notable and desirable effect of master editions is that as prints are sold, the artwork will still remain visible in the artist's wallet as a master edition, while the prints appear in the purchaser's wallets.

#### Print

A print represents a copy of an NFT, and is created from a `Master Edition`. Each print has an edition number associated with it.

#### Normal NFT

A `Normal NFT` when minted represents a non-fungible token on Everscale and metadata, but lacks rights to print. An example of a normal NFT would be an artwork that is a one-of-a-kind that, once sold, is no longer within the artist's own wallet, but is in the purchaser's wallet.

### LiquidNFTCollection

`LiquidNFTCollection` - Contract that represents `Collection` that can mint `Tokens`. 

### Distributor

`Distributor` - Contract that represents a wrapper around `Collection` that allows to control mint process. It can keep any number of pre-uploaded `Tokens` and mint them according to a set of predefined rules like mint price, mint whitelist with mint count limit (when only allowed addresses can mint `Tokens`), mint sale and presale start dates, etc.

## MVP limitations

MVP is not a release version, it has some experimental features, some corners are cut (like currently DeBots are stuck on compiler version 0.47.0) and some non-implemented design ideas exist.

Before it becomes a release it needs to run several rounds of testing.

Here are some of the limitations of current MVP version:

* `DeBot` is hard coded only for one `Distributor`.
* `Distributor` configuration file accepts only UNIX time as sale start date and presale start date. Human readable format is required.
* `Distributor` upload is missing progress indicator.
* `Generator` is not trained to detect duplicate generations, tokens can repeat.

## Running the tests

Requirements:

`Linux/Mac (bash)`

`python` - `3.9+` (including `pip`)

`ton-client-py` - `1.27.0+`

`TON OS SE`

Installing dependencies:

```
pip install -r requirements.txt
```

Running test scripts:

```
cd tests
./run_tests.py http://127.0.0.1
```

Please use the address where your `TON OS SE` is installed.

## Running CLI

```
cd tests
./cli
```

## Creating a geenerative art collection

`WARNING!` The followng Github repository was used to generate a test collection: https://github.com/HashLips/generative-art-node. All the resources from this repo are used ONLY for educational purposes.

All assets are in `tests/assets_raw` folder.

Run the script `./generate assets.py` to generate 200 assets in `assets_generated` folder (quantity can be changed on line 75 of the script).

Default metadata is on line 15 of the script.

## Creating a distributor using CLI

`WARNING!` Pinata Cloud is used for IPFS storage here. Free account gives you up to 1 Gb of free space, if you are a jury and you need Pinata access tokens (and you don't want to create an account) please contact me at https://t.me/SuperArmor and I'll give you access to mine.

`WARNING!` Collection was deployed in devnet but whitelist was enabled! If you are a jury and you want to try and mint an NFT please contact me at https://t.me/SuperArmor and I'll include your wallet address to whitelist.

`WARNING!` Assumption is that you run all the scripts from `tests` folder. Please do the following at the beginning:

```
cd tests
pip install -r requirements.txt
```

1. Initialize Wallet and Distributor configuration:

```
./cli init
```

Please use `--force-wallet` and `--force-distributor` to recreate `Wallet` or `Distributor` respectively.

This will give you information about `Wallet` address. Please top it up with some EVERs. MVP unoptimized version will use ~170 EVERs to upload 10k NFTs, keep that in mind.

2. Prepare your assets folder:

To mint NFTs, your `Distributor` needs to be loaded up with your project's artwork and metadata.

The artwork is generally a collection of .png files and the metadata is a series of .json files that correspond 1:1 for each image in your collection.

Many projects choose to generate their artwork and metadata. This approach is powerful, but also advanced.

A two item collection would contain four files.

```
0.png
0.json
1.png
1.json
```

0.png and 0.json are combined to represent the first NFT in this example collection. 1.png and 1.json describe the second NFT, etc.

The content of the image files reflect the artwork you would like to display. The content of the metadata files describe each of these pieces of artwork using the schema defined in the `interfaces/ILiquidNFT.sol` file.

3. Change your `Distributor` configuration:

Edit `config.json` file and set your `Distributor` parameters and `Collection` metadata. `Collection` metadata has the same format as `Token` metadata but keeps information about collection, including but not limited to collection name, desctiption, symbol, cover image, etc.

4. Upload your assets to IPFS and metadata to blockchain (assuming you are using "assets" folder for assets):

```
./cli upload assets
```

If the upload is interrupted you can rerun the command and it will start from where it left. Run this command as many times as needed until all your assets and metadatas are uploaded.

5. Verify uploaded assets (assuming you are using "assets" folder for assets):

```
./cli verify assets
```

If all is OK you will see something like this:

```
Starting verification...
Verification is SUCCESSFUL!
50 of 50 assets uploaded correctly.
```

6. Finalize Distributor tokens:

```
./cli finalize
```

If all is OK you will see something like this:

```
Locking Distributor Tokens...
Locking complete!
```

Now you can share your Distributor address and call `mint()`!

For complete API list please refer to `STANDARD.md` file.