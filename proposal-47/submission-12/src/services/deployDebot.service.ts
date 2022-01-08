import { Account } from '@tonclient/appkit';
import { TonClient } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import fs from 'fs';
import path from 'path';
import { DeployContractService } from './deployContract.service';



TonClient.useBinaryLibrary(libNode);

export class DeployDebotService {

    private readonly deployContractService: DeployContractService;
    constructor() {

        this.deployContractService = new DeployContractService;

    }


    async deployDebot(Path: string) : Promise<string> {
        let nftDebotAccount = await this.deployContractService.createAccount(await this.deployContractService.compileContract("NftDebot", Path), Path);
        console.log("NftDebot account created");
        let address = await this.deployDebotAccount(nftDebotAccount);
        await this.setAbi(nftDebotAccount, Path);
        return address;
    }
    

    private async deployDebotAccount(
        nftDebotAccount: Account, 
        ) : Promise<string> {

        let address: string = '';

         try {
            await this.deployContractService.deployContract({
                account: nftDebotAccount, 
                initInput: {},
                valueTON: 5000000000,
            });
            address = await nftDebotAccount.getAddress();
            console.log("NftDebot contract was deployed at address: " + address);
        } catch(err) {
            console.log(err);
        }
        return address;
    }


    private async setAbi(
        debotAccount: Account, 
        Path: string
        ) : Promise<void> {

        let debotAddress = await debotAccount.getAddress();
        let abiDebot = fs.readFileSync(path.resolve(Path, 'NftDebot.abi.json'), "utf8");
      
        const buf = Buffer.from(abiDebot, "ascii");
        const abi = buf.toString("hex");
        
        try {
            await debotAccount.client.processing.process_message({
                message_encode_params: {
                    abi: debotAccount.abi,
                    address: debotAddress,
                    signer: debotAccount.signer,
                    call_set: {
                        function_name: "setABI",
                        input: {
                            dabi: abi
                        }
                    },
                },
                send_events: true,
            });
            
        } catch(err) {
            console.log(err);
        }
    }
}