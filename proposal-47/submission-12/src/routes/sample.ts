import express from 'express';
import path from 'path';
import fs from 'fs';
import { globals } from '../config/globals';
import { UploadFileToIPFSService } from '../services/uploadFileToIPFS.service';
//import { addSeveralParams, addSingleParam} from '../services/addParamsToContract.service';
import { DeployContractService } from '../services/deploy-contract.service';
import { NFTCollectionJSON } from '../services/deployForm.service';
import { DeployTrueNFTContractsCollection } from '../services/deploy-trueNFT-collection.service';
import { Param } from '../models/param-model';
import { RarityType } from '../models/rarity-model';
import { CollectionModel } from '../models/collention-model';
import { ContractGeneratorService } from '../services/contractGenerator.service';

const router = express.Router();

/* GET sample listing. */
router.get('/deploy-truenft-contracts', async function(req, res, next){ 
  const trueNFTPath = globals.CONTRACTS_PATH;
  const deployTrueNFT = new DeployTrueNFTContractsCollection;
  let dataContract = fs.readFileSync(path.resolve(trueNFTPath, 'Data.sol')).toString();
  let indexContract = fs.readFileSync(path.resolve(trueNFTPath, 'Index.sol')).toString();
  let indexBasisContract = fs.readFileSync(path.resolve(trueNFTPath, 'IndexBasis.sol')).toString();
  let nftRootContract = fs.readFileSync(path.resolve(trueNFTPath, 'NftRoot.sol')).toString();
  let inputParamets = await JSON.parse(fs.readFileSync(path.resolve(trueNFTPath, 'inputRootParameters.json')).toString())

  const convert = (from, to) => (data) => Buffer.from(data, from).toString(to);
  const utf8ToHex = convert("utf8", "hex");
  for (var i = 0; i < inputParamets.raritiesList.length; i++) {
    inputParamets.raritiesList[i].rarityName = utf8ToHex(inputParamets.raritiesList[i].rarityName);
  }

  deployTrueNFT.deployTrueNFTContracts(dataContract, indexContract, indexBasisContract, nftRootContract, 
    utf8ToHex(inputParamets.rootName), utf8ToHex(inputParamets.rootIcon), inputParamets.tokensLimit, inputParamets.raritiesList, trueNFTPath);
  res.render('deployTrueNftContracts', {tittle: 'Contracts Deploy'});

});

router.get('/deploy-contract', async function(req, res, next) {
  const compilationPath = globals.DATA_SAMPLES_PATH;
  const contractCode = fs.readFileSync(compilationPath + '/ContractForDeployTest.sol').toString();
  const deployService = new DeployContractService;
  let contractName = await deployService.compileContract(contractCode, compilationPath);
  let contractAcc = await deployService.createAccount(contractName, compilationPath);
  let address = await deployService.getContractAddress(contractAcc);
  let dabi = await deployService.getContractDabi(contractAcc);
  let code = await deployService.getContractCode(contractAcc);
  res.render('deployContract', {tittle: 'Contract Deploy', contractName: contractName, address: address, dabi: dabi, code: code.code});
});

router.get('/new-params', function(req, res, next) {

  // const pahtToNftRoot = path.join(globals.CONTRACTS_ROOT, 'NftRoot.sol');
  // let codeSource = fs.readFileSync(pahtToNftRoot, 'utf8');

  // console.log(addSingleParam(codeSource, {type: 'int256', name: 'new_param'}));
  // console.log(addSeveralDataParams(codeSource, [{type: 'int256', name: 'new_param1'}, {type: 'int256', name: 'new_param2'}, {type: 'int256', name: 'new_param3'}]));

  res.send('respond with a resource');
});

router.get('/ipfs', async function(req, res, next) {
  const uploadService = new UploadFileToIPFSService;
  const testFilePath = path.join(globals.DATA_SAMPLES_PATH, "ipfsTest.txt");
  const url = await uploadService.upload(testFilePath);
  res.send(`url to the file: ${url}`);
});

router.get('/param-form', function(req, res, next) {
  res.render('param_form');
});

router.post('/param-form', function(req, res, next) {
  console.log(req.body);
})

router.get("/generate-contract", async function(req, res, next) {
  const params : Param[] = [
    { type: 'int256', name: 'new_param'}, 
    { type: 'int256', name: 'new_param1'}
  ];

  const rarity: RarityType[] = [
    { rarityName: "rate", amount: 10 },
    { rarityName: "norare", amount: 90 }
  ];

  const collection: CollectionModel = {
    rootName: "test",
    rootIcon: "abc",
    raritiesList: rarity
  };

  const generatorService = new ContractGeneratorService
  generatorService.generateContract(collection)


  res.send('Файлы сгенерированы');
})

export {router as sampleRouter};
