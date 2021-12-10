
import path from 'path';
import fs from 'fs';
import { DeployTrueNFTContractsCollection } from './deployTrueNFTCollection.service';
import { Param } from '../models/param-model';
import { RarityType } from '../models/rarity-model';
import { CollectionModel } from '../models/collention-model';
import { ContractGeneratorService } from './contractGenerator.service';
import { globals } from '../config/globals';

export class NFTCollectionJSON {
    //public static generate(jsonParameters: JSON) {
      public static  async deploy(input: JSON) {
     
      
          const rarity: RarityType[] = input['raritiesList'];
          const params: Param[] = input['paramsData'];
        
          const collection: CollectionModel = {
            rootName: input['rootName'],
            rootIcon: '7468616e6b20796f75',
            raritiesList: rarity,
            paramsData: params, 
          };
        
            
          const generatorService = new ContractGeneratorService;
          let trueNFTPath =  await generatorService.generateContract(collection);

          const deployTrueNFT = new DeployTrueNFTContractsCollection;
          let dataContract = fs.readFileSync(path.resolve(trueNFTPath, 'Data.sol')).toString();
          let indexContract = fs.readFileSync(path.resolve(trueNFTPath, 'Index.sol')).toString();
          let indexBasisContract = fs.readFileSync(path.resolve(trueNFTPath, 'IndexBasis.sol')).toString();
          let nftRootContract = fs.readFileSync(path.resolve(trueNFTPath, 'NftRoot.sol')).toString();


          let inputPath = path.join(trueNFTPath, 'inputRootParameters.json');
          let inputRootParamets = await JSON.parse(fs.readFileSync(inputPath).toString());
          
          const convert = (from, to) => (data) => Buffer.from(data, from).toString(to);
          const utf8ToHex = convert("utf8", "hex");

          let summLimit: number = 0;
          for (var i = 0; i < inputRootParamets.raritiesList.length; i++) {
            inputRootParamets.raritiesList[i].rarityName = utf8ToHex(inputRootParamets.raritiesList[i].rarityName);
            summLimit = summLimit + inputRootParamets.raritiesList[i].amount;
          }

          const rootAddress = await deployTrueNFT.deployTrueNFTContracts(dataContract, indexContract, indexBasisContract, nftRootContract, 
            utf8ToHex(inputRootParamets.rootName), utf8ToHex(inputRootParamets.rootIcon), summLimit, inputRootParamets.raritiesList, trueNFTPath);

            if (rootAddress !== '' && fs.existsSync(trueNFTPath)) {
              fs.renameSync(trueNFTPath, path.join(globals.TEMP_PATH, rootAddress.substr(2)));
            }
            
      }
    
}
