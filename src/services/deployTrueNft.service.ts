import path from 'path';
import fs from 'fs';
import { DeployService } from './deploy.service';
import { Account } from '@tonclient/appkit';

export class DeployTrueNftService {
    private deployService : DeployService;

    constructor() {
        this.deployService = new DeployService();
    }
    
    async deployTrueNft(pathWithContracts : string) : Promise<string> {
        
        let indexBasisContract = fs.readFileSync(path.resolve(pathWithContracts, "IndexBasis.sol")).toString();
        let dataContract = fs.readFileSync(path.resolve(pathWithContracts, "Data.sol")).toString();
        let indexContract = fs.readFileSync(path.resolve(pathWithContracts, "Index.sol")).toString();
        let rootNftContract = fs.readFileSync(path.resolve(pathWithContracts, "NftRoot.sol")).toString();
        
        let dataAccount = await this.deployService.createContractAccount(dataContract, pathWithContracts);
        let indexAccount = await this.deployService.createContractAccount(indexContract, pathWithContracts);
        let rootNftAccount = await this.deployService.createContractAccount(rootNftContract, pathWithContracts);
        let indexBasisAccount = await this.deployService.createContractAccount(indexBasisContract, pathWithContracts);
        
        let address = this.deployRootNft(rootNftAccount, indexAccount, dataAccount);
        this.deployBasis(rootNftAccount, indexBasisAccount);

        return address;
    }

    private async deployRootNft(rootNftAccount: Account, indexAccount: Account, dataAccount: Account) : Promise<string> {
        try {
            await this.deployService.deploy(
                rootNftAccount,
                {
                    codeIndex: (await this.deployService.getDecodeTVC(indexAccount)).code,
                    codeData: (await this.deployService.getDecodeTVC(dataAccount)).code  
                }
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
}