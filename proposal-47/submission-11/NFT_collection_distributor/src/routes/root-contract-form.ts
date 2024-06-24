import express from 'express';
import path from 'path';
import fs from 'fs'

import { globals } from '../config/globals';
import { everscale_settings } from '../config/everscale-settings';
import { Collection } from '../models/collection';
import { generateContract } from '../services/contract-generator.service';
import { ContractObjectCreator } from '../services/contract-object-creator.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { EnumParameter } from '../models/enum';
import { DeployDebotService } from '../services/deployDebot.service';
import { MediaFile } from '../models/mediafile';
import { JsonCollectionSevice } from '../services/json-collection.service';
import { DirectSaleService } from '../services/directSale.service';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});

router.post('/save-data', async function(req, res, next) {
    let jsonCollectionService = new JsonCollectionSevice()
    let jsonCollection = await jsonCollectionService.makeJsonCollection(req);

    let tepmDir = fs.mkdtempSync(path.join(globals.RESULT_JSON, 'json-'));
    let jsonFileCollection = path.join(tepmDir, 'collection.json');

    fs.writeFileSync(jsonFileCollection, jsonCollection, {flag: 'w'});

    res.download(jsonFileCollection, () => {
        fs.rmSync(tepmDir, {recursive: true, force: true});
    });
});
//checkCommissionFavorOwner - checkbox  Commission to Collection Owner
//commissionFavorOwner - Commission to Collection Owner
//MintingPriceForUsers - Minting price for users (EVERs)


router.post('/form-contracts', async function(req, res, next) {
    let jsonCollectionService = new JsonCollectionSevice()
    let contractObjectCreator = new ContractObjectCreator()
    let jsonCollection = await jsonCollectionService.makeJsonCollection(req);
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req)
    let MintingPriceForUsers = 0;
    if (req.body.MintingPriceForUsers !== '') {
        MintingPriceForUsers = req.body.MintingPriceForUsers;
    }
    // TODO: Passing comissionAuthorGenerator to generateContract is very bad decision, but to do it properly there are so many to change
    let contractDir = await generateContract(collection, jsonCollection, enums, mediafiles, MintingPriceForUsers)

    res.render('success-page', { pageText: "Файлы сгенерированы в директорию: " + path.basename(contractDir) })
});

router.post('/deploy-contracts', async function(req, res, next) {
    let jsonCollectionService = new JsonCollectionSevice()
    let contractObjectCreator = new ContractObjectCreator()
    // Временный костыль, потом заменить нормально, статическая переменная (для рута) видимо не может быть пустой
    if (req.body.nameContract == '') {
        req.body.nameContract = 'name';
    }
    let jsonCollection = await jsonCollectionService.makeJsonCollection(req);
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req);
    let MintingPriceForUsers = 0;
    if (req.body.MintingPriceForUsers !== '') {
        MintingPriceForUsers = req.body.MintingPriceForUsers;
    }
    let commissionFavorOwner = 0;
    if (req.body.checkCommissionFavorOwner == '') {
        if (req.body.commissionFavorOwner !== '') {
            commissionFavorOwner = req.body.commissionFavorOwner;
        }
    }
    // TODO: Passing comissionAuthorGenerator to generateContract is very bad decision, but to do it properly there are so many to change
    let contractDir = await generateContract(collection, jsonCollection, enums, mediafiles, MintingPriceForUsers);
    let deployTrueNftService = new DeployTrueNftService();
    let rootNftAddress = await deployTrueNftService.deployTrueNft(contractDir, collection, MintingPriceForUsers, commissionFavorOwner)
    contractDir = path.join(globals.RESULT_COLLECTION, rootNftAddress.slice(2));
    const directSaleService = new DirectSaleService();
    let addrRoyaltyAgent = everscale_settings.ADDRESS_ROYALTY_AGENT;
    let royaltyPercent = everscale_settings.ROYALTY_PERCENT;
    let directSaleRootAddr = await directSaleService.deployDirectSaleRoot(rootNftAddress.slice(2), addrRoyaltyAgent, royaltyPercent);
    console.log("DirectSaleRoot address: " + directSaleRootAddr);
    let deployDebotService = new DeployDebotService();
    let initDataForMintingDebot = {
        _addrNFTRoot: rootNftAddress
    };
    let mintingDebotAddress = await deployDebotService.deployDebot(contractDir, "MintingDebot", initDataForMintingDebot);
    let initDataForSellingDebot = {
        _addrDirectSaleRoot: directSaleRootAddr
    };
    let sellingDebotAddress = await deployDebotService.deployDebot(contractDir, "SellingDebot", initDataForSellingDebot);
    let tokenPurchaseDebot = await deployDebotService.deployDebot(contractDir, "TokenPurchaseDebot");
    
    res.redirect('/tokens-data-info?rootNftAddress=' + rootNftAddress)
});
  
router.post('/', async function(req, res, next) {

    // let contractObjectCreator = new ContractObjectCreator()
    // let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    // let contractDir = await generateContract(collection)

    // //Зачем коментирвать весь метод?
    // let deployTrueNftService = new DeployTrueNftService()
    // let address = await deployTrueNftService.deployTrueNft(contractDir, collection, 0)

    // // deleteContractDirTemp(collection)

    // res.send("Адрес коллекции: " + address)
    res.send("root")
    
});


export {router as rootContractForm};
