import { Account } from '@tonclient/appkit';
import { DeployContractService } from './deployContract.service';
import { RarityType } from '../models/rarity-model';

export class DeployTrueNFTContractsCollection {

    private readonly deployContractService: DeployContractService;

    constructor() {

        this.deployContractService = new DeployContractService;

    }

    async deployTrueNFTContracts(
        dataContract: string, 
        indexContract: string, 
        indexBasisContract: string,
        nftRootContract: string,
        _rootName: string,
        _rootIcon: string,
        _tokensLimit: number,
        _raritiesList: RarityType[],
        compilationPathTemp: string) : Promise<string> {

        let dataAccount = await this.deployContractService.createAccount(await this.deployContractService.compileContract(dataContract, compilationPathTemp), compilationPathTemp);
        let indexAccount = await this.deployContractService.createAccount(await this.deployContractService.compileContract(indexContract,compilationPathTemp), compilationPathTemp);
        let indexBasisAccount = await this.deployContractService.createAccount(await this.deployContractService.compileContract(indexBasisContract, compilationPathTemp), compilationPathTemp);
        let nftRootAccount = await this.deployContractService.createAccount(await this.deployContractService.compileContract(nftRootContract, compilationPathTemp), compilationPathTemp);
        
        const addressRoot = await this.deployNftRoot(nftRootAccount, dataAccount ,indexAccount, _rootName, _rootIcon, _tokensLimit, _raritiesList);
        await this.deployBasis(nftRootAccount, indexBasisAccount);

        return addressRoot;
    }

    private async deployNftRoot(
        nftRootAccount: Account, 
        dataAccount: Account, 
        indexAccount: Account,
        _rootName: string,
        _rootIcon: string,
        _tokensLimit: number,
        _raritiesList: RarityType[]
        ) : Promise<string> {

        let indexCode = await this.deployContractService.getContractCode(indexAccount).then(code => {return code.code});
        let dataCode = await this.deployContractService.getContractCode(dataAccount).then(code => {return code.code});
        let address: string = '';

         try {
            await this.deployContractService.deployContract({
                account: nftRootAccount, 
                initInput: {
                    rootName: _rootName,
                    rootIcon: _rootIcon,
                    codeIndex: indexCode,
                    codeData: dataCode,
                    tokensLimit: _tokensLimit,
                    raritiesList: _raritiesList 
                },
                valueTON: 5000000000
            });
            address = await nftRootAccount.getAddress();
            console.log("NftRoot contract was deployed at address: " + address);
        } catch(err) {
            console.log(err);
        }

        return address;
    }

    private async deployBasis(
        nftRootAccount: Account, 
        indexBasisAccount: Account
        ) : Promise<void> {

        let nftRootAddress = await nftRootAccount.getAddress();
        let indexBasisCode = await this.deployContractService.getContractCode(indexBasisAccount).then(code => {return code.code});
        
 

        const client = nftRootAccount.client;
        const walletAcc = await  this.deployContractService.getCurrentWallet();
       

 
        try {
            const payload = (await client.abi.encode_message_body({
                abi: nftRootAccount.abi,
                signer: nftRootAccount.signer,
                is_internal: true,
                call_set: {
                    function_name: "deployBasis",
                    input: {
                        codeIndexBasis: indexBasisCode,
                    },
                }
            })).body;

            await walletAcc.run("sendTransaction", {
                dest: nftRootAddress,
                value: 600_000_000,
                flags: 3,
                bounce: true,
                payload: payload,
            });

            console.log("IndexBasis contract was deployed.");
        } catch(err) {
            console.log(err);
        }
    }

}