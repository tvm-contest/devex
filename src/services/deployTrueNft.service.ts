import path from 'path';
import fs from 'fs';
import { DeployService } from './deploy.service';
import { Account } from '@tonclient/appkit';
import { Collection } from '../models/collection';

export class DeployTrueNftService {
    private deployService : DeployService;

    constructor() {
        this.deployService = new DeployService();
    }
    
    async deployTrueNft(pathWithContracts : string, collection: Collection) : Promise<string> {
        
        let indexBasisContract = fs.readFileSync(path.resolve(pathWithContracts, "IndexBasis.sol")).toString();
        let dataContract = fs.readFileSync(path.resolve(pathWithContracts, "Data.sol")).toString();
        let indexContract = fs.readFileSync(path.resolve(pathWithContracts, "Index.sol")).toString();
        let rootNftContract = fs.readFileSync(path.resolve(pathWithContracts, "NftRoot.sol")).toString();
        
        let dataAccount = await this.deployService.createContractAccount(dataContract, pathWithContracts);
        let indexAccount = await this.deployService.createContractAccount(indexContract, pathWithContracts);
        let rootNftAccount = await this.deployService.createContractAccount(rootNftContract, pathWithContracts);
        let indexBasisAccount = await this.deployService.createContractAccount(indexBasisContract, pathWithContracts);
        
        let initInput = await this.buildInitInput(indexAccount, dataAccount, collection)
        let address = this.deployRootNft(rootNftAccount, initInput);
        this.deployBasis(rootNftAccount, indexBasisAccount);

        return address;
    }

    private async deployRootNft(rootNftAccount: Account, initInput: object) : Promise<string> {
        try {
            await this.deployService.deploy(
                rootNftAccount,
                initInput
            );
            return rootNftAccount.getAddress();
        } catch(err) {
            console.log(err);
            return "0";
        }
    }

    private async deployBasis(rootNftAccount: Account, indexBasisAccount: Account) : Promise<void> {
        try {
            await rootNftAccount.run(
                "deployBasis", 
                {
                    codeIndexBasis: (await this.deployService.getDecodeTVC(indexBasisAccount)).code,
                }
            );
            console.log("IndexBasis was deployed at address:" + indexBasisAccount.getAddress());
        } catch(err) {
            console.log(err);
        }
    }

    private async buildInitInput(indexAccount: Account, dataAccount: Account, collection: Collection) : Promise<object> {

        let _nftTypes : string[] = [];
        let _limit : number[] = [];
        for (let index = 0; index < collection.getRarities().length; index++) {
            _nftTypes.push('"' + collection.getRarities()[index].getName() + '"')
            _limit.push(collection.getRarities()[index].getLimit())
        }
        let _name = collection.getDescription().getName()
        let _icon = collection.getDescription().getIcon()

        let initInputString : string = `{
            "codeIndex": "${(await this.deployService.getDecodeTVC(indexAccount)).code}",
            "codeData": "${(await this.deployService.getDecodeTVC(dataAccount)).code}",
            "nftTypes": [${_nftTypes.toString()}],
            "limit": [${_limit}],
            "name": "${_name}",
            "icon": "${_icon}"`
        
        for (let index = 0; index < collection.getParameters().length; index++) {
            let paramName = collection.getParameters()[index].getName()
            initInputString += `,\n"_${paramName}": "${paramName}"`
        }
        initInputString += `}`

        let initInput = JSON.parse(initInputString)

        console.log(initInput)
        return initInput
    }
}