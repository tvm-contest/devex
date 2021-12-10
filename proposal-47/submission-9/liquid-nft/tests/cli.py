#!/usr/bin/env python3

# ==============================================================================
# 
import os
import sys
import click
import json
import random

import freeton_utils
from   freeton_utils                import *
from   pinatapy                     import PinataPy
from   pprint                       import pprint
from   contract_Distributor         import Distributor
from   contract_LiquidNFT           import LiquidNFT
from   contract_LiquidNFTCollection import LiquidNFTCollection
from   contract_DistributorDebot    import DistributorDebot

# ==============================================================================
# 
def getClient():
    return TonClient(config=ClientConfig(network=NetworkConfig(endpoints=getApiEndpoints(True))))

# ==============================================================================
# 
distributorConfig = {
    "nonce": 0,
    "pinata_api_key": "",
    "pinata_secret_api_key": "",
    "creatorAddress": "",
    "ownerAddress": "",
    "ownerPubkey": "",
    "treasuryAddress": "",
    "presaleStartDate": "",
    "saleStartDate": "",
    "price": EVER,
    "collectionMetadataContents" : {
        "name": "",
        "symbol": "",
        "description": "",
        "image": "",
        "animation_url": "",
        "external_url": "",
        "properties": {
            "files": [{ "uri": "", "type": "image/png"}],
            "category": "image"
        }
    },
    "tokenPrimarySaleHappened": True,
    "tokenMetadataIsMutable": True,
    "tokenMasterEditionMaxSupply": 0,
    "tokenMasterEditionPrintLocked": True,
    "tokenCreatorsPercent": 500,
    "tokenCreatorsShares": []
}

# ==============================================================================
# 
def getWallet() -> Multisig:
    fileExists = os.path.exists("msig.json")
    msig = Multisig(tonClient=getClient(), signer=loadSigner("msig.json"))
    return msig

def walletExists() -> bool:
    try: 
        msig = getWallet()
        return True
    except:
        return False

def walletDeployed() -> bool:
    try: 
        msig = getWallet()
        accType = msig.getAccType()
        if accType == 0 and msig.getBalance() > DIME * 2:
            click.echo(f"Trying to deploy the Wallet...")
            msig.deploy()
            click.echo(f"Done!")
        
        # Try to get accType one more time after we tried to deploy
        return (msig.getAccType() == 1)
    except:
        click.echo(f"Wallet not found. Please run \"init\" first.")
        return False

# ==============================================================================
# 
def getDistributor() -> Distributor:
    msig = getWallet()
    with open("config.json") as f:
        data = f.read()
    config = ast.literal_eval(data)

    distributor = Distributor(tonClient                     = getClient(), 
                              nonce                         = config["nonce"], 
                              creatorAddress                = config["creatorAddress"],
                              ownerAddress                  = config["ownerAddress"],
                              ownerPubkey                   = "0x" + str(config["ownerPubkey"]),
                              treasuryAddress               = config["treasuryAddress"],
                              presaleStartDate              = config["presaleStartDate"],
                              saleStartDate                 = config["saleStartDate"],
                              price                         = config["price"],
                              collectionMetadataContents    = config["collectionMetadataContents"],
                              tokenPrimarySaleHappened      = config["tokenPrimarySaleHappened"],
                              tokenMetadataIsMutable        = config["tokenMetadataIsMutable"],
                              tokenMasterEditionMaxSupply   = config["tokenMasterEditionMaxSupply"],
                              tokenMasterEditionPrintLocked = config["tokenMasterEditionPrintLocked"],
                              tokenCreatorsPercent          = config["tokenCreatorsPercent"],
                              tokenCreatorsShares           = config["tokenCreatorsShares"],
                              signer                        = msig.SIGNER)
    return distributor

def distributorExists() -> bool:
    try: 
        with open("config.json") as f:
            data = f.read()
        config = ast.literal_eval(data)
        return True
    except:
        return False

def distributorDeployed() -> bool:
    try: 
        distributor = getDistributor()
        accType = distributor.getAccType()
        if accType == 0 and distributor.getBalance() <  DIME * 2:
            msig = getWallet()
            msig.sendTransaction(addressDest=distributor.ADDRESS, value=DIME*3, payload="", flags=1)
            time.sleep(10) # let devnet update the numbers

        if accType == 0 and distributor.getBalance() >= DIME * 2:
            click.echo(f"Trying to deploy Distributor...")
            #print(distributor.ADDRESS)
            result = distributor.deploy()
            click.echo(f"Deployed!")
        
        # Try to get accType one more time after we tried to deploy
        return (distributor.getAccType() == 1)
    except:
        click.echo(f"Distributor config not found. Please run \"init\" first.")
        return False

# ==============================================================================
#
def getDistributorConfig():
    with open("config.json") as f:
        data = f.read()
    config = ast.literal_eval(data)
    return config

# ==============================================================================
#
def getNumberOfAssets(assetFolder: str) -> int:
    count = 0
    while True:
        num = 0
        num = num + (1 if os.path.exists(os.path.join(assetFolder, str(count) + ".json")) else 0)
        num = num + (1 if os.path.exists(os.path.join(assetFolder, str(count) + ".png" )) else 0)
        if num == 2:
            count += 1
        elif num == 1:
            click.echo(f"ERROR!")
            click.echo(f"JSON file count doesn't match PNG file count!")
            click.echo(f"Aborting...")
            quit()           
        else:
            break
    
    return count

# ==============================================================================
# ==============================================================================
# ==============================================================================
# 
@click.group()
def cli():
    """
    This is a CLI for Distributor creation and management.
    """

# ==============================================================================
# 
@cli.command()
@click.option("-fw", "--force-wallet",      "force_wallet",       is_flag=True, default=False)
@click.option("-fd", "--force-distributor", "force_distributor",  is_flag=True, default=False)
def init(force_wallet, force_distributor):
    """
    Initializes new Wallet and new Distributor config.
    """
    fileExists = os.path.exists("msig.json")
    if not fileExists or (fileExists and force_wallet):
        click.echo(f"1. Generating new keypair...")
        signer=generateSigner()
        signer.keys.dump("msig.json", False)
        msig = getWallet()

        click.echo(f"   Wallet keypair was saved to \"msig.json\" file!")
        click.echo(f"   Wallet address is {msig.ADDRESS}. \nPlease send some EVERs to this address before proceeding.")
        click.echo(f"   NOTE: any commands that involve spending EVERs will deploy needed contracts automatically,")
        click.echo(f"         you just need to have positive balance on Multisig address.")
    else:
        click.echo(f"ERROR!")
        click.echo(f"Wallet config already exists.\nIf you want to force overwrite it, run the command with \"--force-wallet\" option.")
    
    fileExists = fileExists or os.path.exists("config.json")
    if not fileExists or (fileExists and force_distributor):
        click.echo(f"2. Generating new Distributor config...")

        config = distributorConfig.copy()
        config["nonce"]               = hex(random.randint(0, 0xFFFFFFFFFFFFFFFFFFFFFFFF))
        config["creatorAddress"]      = msig.ADDRESS
        config["ownerAddress"]        = msig.ADDRESS
        config["ownerPubkey"]         = msig.SIGNER.keys.public
        config["treasuryAddress"]     = msig.ADDRESS
        config["presaleStartDate"]    = 0xFFFFFFFF
        config["saleStartDate"]       = 0xFFFFFFFF
        config["tokenCreatorsShares"] = [{"creatorAddress":msig.ADDRESS, "creatorShare":100}]

        with open("config.json", "w") as out:
            pprint(config, stream=out)
        click.echo(f"   Distributor config was saved to \"config.json\" file!")
        click.echo(f"   Please edit the config before uploading media!")
        click.echo(f"   Don't forget to fill out \"pinata_api_key\" and \"pinata_secret_api_key\" parameters before using IPFS!")

        # Try to deploy here, just in case
        walletDeployed()
        distributorDeployed()
    else:
        click.echo(f"ERROR!")
        click.echo(f"Distributor config already exists.\nIf you want to force overwrite it, run the command with \"--force-distributor\" option.")
    
# ==============================================================================
# 
@cli.command()
def wallet():
    """
    Shows Wallet address, status and balance.
    """

    if not walletExists():
        click.echo(f"Wallet not found. Please run \"init\" first.")
        return
    
    msig   = getWallet()
    status = "Deployed" if walletDeployed() else "Not deployed"
    click.echo(f"Contract: SetcodeMultisigWallet.sol\n Address: {msig.ADDRESS}\n Balance: {int(msig.getBalance())/EVER} EVER\n  Status: {status}")

# ==============================================================================
# 
@cli.command()
def distributor():
    """
    Shows Distributor address, status and balance.
    """

    if not distributorExists():
        click.echo(f"Distributor config not found. Please run \"init\" first.")
        return
    
    distributor = getDistributor()
    status       = "Deployed" if distributorDeployed() else "Not deployed"
    click.echo(f"Contract: Distributor.sol\n Address: {distributor.ADDRESS}\n Balance: {int(distributor.getBalance())/EVER} EVER\n  Status: {status}")

# ==============================================================================
# 
@cli.command()
def mint():
    """
    Mints NFT as a user.
    """

    click.echo(f"Starting Token mint...")
    msig        = getWallet()
    distributor = getDistributor()
    price       = int(distributor.getInfo()["price"])
    distributor.mint(msig=msig, value = price + DIME*5)
    click.echo(f"Minting done!")

# ==============================================================================
# 
@cli.command()
@click.argument("target_address", type=str)
def mintInternal(target_address):
    """
    Mints NFT as an administrator. Sale/Presale dates are ignored, price is ignored.
    """

    click.echo(f"Starting Token mint...")
    msig        = getWallet()
    distributor = getDistributor()
    distributor.mintInternal(msig=msig, targetOwnerAddress=target_address)
    click.echo(f"Minting done!")

# ==============================================================================
# 
@cli.command()
@click.argument("price",              type=int)
@click.argument("sale_start_date",    type=int)
@click.argument("presale_start_date", type=int)
def change(price, sale_start_date, presale_start_date):
    """
    Changes Distributor mint price, sale start date and presale start date.
    Please use 0 if your Distributor doesn't have presale.
    """
    
    click.echo(f"Starting Distributor parameters change...")
    fileExists = os.path.exists("config.json")
    if not fileExists:
        click.echo(f"Distributor config not found. Please run \"init\" first.")
        return

    msig        = getWallet()
    distributor = getDistributor()
    distributor.change(msig = msig, saleStartDate = sale_start_date, presaleStartDate = presale_start_date, price = price)

# ==============================================================================
# TODO: show progress of upload
# TODO: upload multiple metadatas at once
@cli.command()
@click.argument("asset_folder", type=str)
def upload(asset_folder):
    """
    Uploads media and metadata from a specific folder to IPFS and blockchain respectively.
    """
    click.echo(f"Starting upload...")
    click.echo(f"Checking contracts...")

    if not walletDeployed():
        return

    if not distributorDeployed():
        return

    numAssets = getNumberOfAssets(asset_folder)
    config    = getDistributorConfig() 
    pinata    = PinataPy(pinata_api_key = config["pinata_api_key"], pinata_secret_api_key = config["pinata_secret_api_key"])

    # Upload files to IPFS first
    click.echo(f"Checking IPFS uploads...")

    for i in range(0, numAssets):
        with open(os.path.join(asset_folder, str(i) + ".json")) as f:
            data = f.read()
        meta = json.loads(data)

        if meta["image"] == "":
            result = pinata.pin_file_to_ipfs(os.path.join(asset_folder, str(i) + ".png"))
            if "IpfsHash" not in result:
                click.echo(f"IPFS upload error! Please check config and run CLI again.")
                click.echo(f"Error message: {result}")
                quit()

            meta["image"]                          = "https://gateway.pinata.cloud/ipfs/" + result["IpfsHash"]
            meta["properties"]["files"][0]["uri"]  = "https://gateway.pinata.cloud/ipfs/" + result["IpfsHash"]
            meta["properties"]["files"][0]["type"] = "image/png"
            meta["properties"]["category"]         = "image"

            jsonFile = os.path.join(asset_folder, str(i) + ".json")
            with open(jsonFile, "w") as fp:
                json.dump(meta, fp)

    # Upload metadatas to blockchain next, start where we left off (check current Distributor contents)
    msig        = getWallet()
    distributor = getDistributor()
    info        = distributor.getInfo(includeTokens = True, includeWhitelist = False)
    metadatas   = info["tokens"]
    
    # Check that all uploaded metadatas are correct
    click.echo(f"Checking current on-chain metadatas...")

    for i in range(0, len(metadatas)):
        with open(os.path.join(asset_folder, str(i) + ".json")) as f:
            data = f.read()
        meta   = json.loads(data)
        dumped = json.dumps(meta)
        if metadatas[i] != dumped:
            click.echo(f"Metadata mismatch! Index: {i}\n Metadata local: {dumped}\nMetadata remote: {metadatas[i]}")
            click.echo(f"Updating...")
            distributor.setToken(msig=msig, index=i, metadata=dumped)
    
    # Upload the remaining
    click.echo(f"Uploading remaining metadatas...")
    metadatasBatch = []
    batchSize = 0
    for i in range(len(metadatas), numAssets):
        with open(os.path.join(asset_folder, str(i) + ".json")) as f:
            data = f.read()
        meta   = json.loads(data)
        dumped = json.dumps(meta)
        #distributor.addTokens(msig=msig, metadatas=[dumped])

        # create a batch and cap at 12KB, when target capacity is reached upload it to blockchain
        metadatasBatch.append(dumped)
        batchSize += len(dumped)
        if batchSize > 12000:
            click.echo(f"Uploadting a batch of {len(metadatasBatch)} metadatas...")
            result = distributor.addTokens(msig=msig, metadatas=metadatasBatch)
            metadatasBatch = []
            batchSize = 0

    if batchSize > 0:
        click.echo(f"Uploadting a batch of {len(metadatasBatch)} metadatas...")
        distributor.addTokens(msig=msig, metadatas=metadatasBatch)
        metadatasBatch = []
        batchSize = 0
    
    click.echo(f"Upload complete!")

# ==============================================================================
# 
@cli.command()
@click.argument("asset_folder", type=str)
def verify(asset_folder):
    """
    Verifies uploaded metadata in Distributor.
    After successfull verification Distributor can be finalized.
    """
    click.echo(f"Starting verification...")

    distributor = getDistributor()
    info        = distributor.getInfo(includeTokens = True, includeWhitelist = False)
    metadatas   = info["tokens"]

    # 1. check the numbers:
    numAssets = getNumberOfAssets(asset_folder)
    print(numAssets, len(metadatas))

    if numAssets != len(metadatas):
        click.echo(f"Verification FAILED!")
        click.echo(f"Upload was not finished properly.")
        quit()

    for i in range(0, numAssets):
        with open(os.path.join(asset_folder, str(i) + ".json")) as f:
            data = f.read()
        meta   = json.loads(data)
        dumped = json.dumps(meta)
        if dumped != metadatas[i]:
            click.echo(f"Verification of asset {i} FAILED!")
            click.echo(f"Upload was not finished properly.")
            click.echo(f"Please run \"finalize\" command to lock Tokens and enable selling capabilities.")

    click.echo(f"Verification is SUCCESSFUL!")
    click.echo(f"{numAssets} of {numAssets} assets uploaded correctly.")

# ==============================================================================
# 
@cli.command()
def finalize():
    """
    Finalizes Distributor creation. Run ONLY after you are sure you uploaded all the media and it is correct!
    This action locks Distributor metadata and is irreversible!
    """
    msig        = getWallet()
    distributor = getDistributor()
    locked = distributor.getInfo()["tokensLocked"]
    if not locked:
        click.echo(f"Locking Distributor Tokens...")
        distributor.lockTokens(msig=msig)
        click.echo(f"Locking complete!")
    else:
        click.echo(f"Distributor Tokens already locked!")
        click.echo(f"Nothing to do here...")

# ==============================================================================
# 
if __name__ == "__main__":
    cli()

"""
msig        = getWallet()
distributor = getDistributor()
debot = DistributorDebot(getClient(), msig.ADDRESS, distributor.ADDRESS, msig.SIGNER)
msig.sendTransaction(debot.ADDRESS, DIME, False, "", 1)
debot.deploy()
debot.setABI(msig=msig, value=DIME)
print("DEBOT:", debot.ADDRESS)
"""
