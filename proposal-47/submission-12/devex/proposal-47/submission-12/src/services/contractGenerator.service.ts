import { join } from "path";
import fs from "fs";
import fse from "fs-extra"

import { sha256 } from "js-sha256";
import { globals } from "../config/globals";

import { CollectionModel } from "../models/collention-model"; 
import { addSeveralParamsToRoot, addSeveralParamsToData, insertAbi} from "./addParamsToContract.service";
import { DeployContractService } from './deploy-contract.service';
import path from "path";


export class ContractGeneratorService {
    private dataFile = join(globals.CONTRACTS_PATH, 'Data.sol');
    private indexFile = join(globals.CONTRACTS_PATH, 'Index.sol');
    private indexBasisFile = join(globals.CONTRACTS_PATH, 'IndexBasis.sol');
    private nftRootFile = join(globals.CONTRACTS_PATH, 'NftRoot.sol');
    private interfacesDir = join(globals.CONTRACTS_PATH, 'interfaces');
    private librariesDir = join(globals.CONTRACTS_PATH, 'libraries');
    private resolversDir = join(globals.CONTRACTS_PATH, 'resolvers');

     async generateContract(collection: CollectionModel): Promise<string> {
        const contractHash = sha256(JSON.stringify(collection));
        const tempDir = join(globals.TEMP_PATH, contractHash);

        if (!fs.existsSync(globals.TEMP_PATH)) {
            fs.mkdirSync(globals.TEMP_PATH);
        }

        const dataFileTemp = join(tempDir, 'Data.sol');
        const indexFileTemp = join(tempDir, 'Index.sol');
        const indexBasisFileTemp = join(tempDir, 'IndexBasis.sol');
        const nftRootFileTemp = join(tempDir, 'NftRoot.sol');
        const interfacesDirTemp = join(tempDir, 'interfaces');
        const librariesDirTemp = join(tempDir, 'libraries');
        const resolversDirTemp = join(tempDir, 'resolvers');

        fse.copySync(this.interfacesDir, interfacesDirTemp);
        fse.copySync(this.librariesDir, librariesDirTemp);
        fse.copySync(this.resolversDir, resolversDirTemp); 

        fs.copyFileSync(this.nftRootFile, nftRootFileTemp);
        fs.copyFileSync(this.dataFile, dataFileTemp);
        fs.copyFileSync(this.indexFile, indexFileTemp);
        fs.copyFileSync(this.indexBasisFile, indexBasisFileTemp);
        
        let codeSourceRoot = fs.readFileSync(nftRootFileTemp).toString();
        let codeSourceData = fs.readFileSync(dataFileTemp).toString();

        if (collection.paramsRoot != undefined) 
            codeSourceRoot = addSeveralParamsToRoot(codeSourceRoot, collection.paramsRoot);        
        if (collection.paramsData != undefined) {
            codeSourceData = addSeveralParamsToData(codeSourceData, collection.paramsData)
            codeSourceRoot = addSeveralParamsToRoot(codeSourceRoot, collection.paramsData);
        }
            
        let service = new DeployContractService();
        await service.compileContract(codeSourceRoot, tempDir, 'NftRoot'); 
        await service.compileContract(codeSourceData, tempDir, 'Data');

        const abiRoot = await JSON.parse(fs.readFileSync(path.resolve(tempDir, 'NftRoot' + '.abi.json')).toString());
        const abiData = await JSON.parse(fs.readFileSync(path.resolve(tempDir, 'Data' + '.abi.json')).toString());
        
        codeSourceRoot = insertAbi(codeSourceRoot,abiRoot);
        codeSourceData = insertAbi(codeSourceData, abiData)

        fs.writeFileSync(nftRootFileTemp, codeSourceRoot);
        fs.writeFileSync(dataFileTemp, codeSourceData);

        this.generateInputData(collection, tempDir);
        this.generateInputRoot(collection, tempDir);
    
        return tempDir;

    }


    deleteTemp(collectionSettings : CollectionModel): boolean {
        const hashContract = sha256(JSON.stringify(collectionSettings));
        const tempDir = join(globals.TEMP_PATH, hashContract)

        if (!fs.existsSync(globals.TEMP_PATH)) {
            return false;
        }

        fs.rmSync(tempDir, { recursive: true, force: true });
        return true;
    }

    generateInputRoot(tokensInfoForm: CollectionModel, pathProject: string) : void {
        let temp = Object.assign({}, tokensInfoForm);;
        
        delete temp.paramsData;
     
        if (!fs.existsSync(pathProject)) {
            fs.mkdirSync(pathProject);
        }

        fs.writeFileSync(path.join(pathProject, "inputRootParameters.json"), JSON.stringify(temp));
    }

    generateInputData(tokensInfoForm: CollectionModel, pathProject: string) : void {

        if (!fs.existsSync(pathProject)) {
            fs.mkdirSync(pathProject);
        }

        if (tokensInfoForm.paramsData != undefined){
            fs.writeFileSync(path.join(pathProject, "inputDataParameters.json"), JSON.stringify(tokensInfoForm.paramsData))
        } 
    }

}