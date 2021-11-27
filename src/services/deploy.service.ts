
import path from 'path';
import { consoleTerminal, runCommand } from 'tondev';
import { Account } from '@tonclient/appkit';
import { TonClient, signerKeys, BocModule, ResultOfDecodeTvc } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import * as fs from 'fs';
import { globals } from '../config/globals'
import { everscale_settings } from '../config/everscale-settings';

export class DeployService {
    private client: TonClient;

    constructor(){
        TonClient.useBinaryLibrary(libNode);

        this.client = new TonClient({
            network: {
                endpoints: [everscale_settings.ENDPOINTS]
            }
        });

        if (!fs.existsSync(globals.TEMP_ROOT)){
            fs.mkdirSync(globals.TEMP_ROOT);
        }
    }

    destructor() : void {
        this.client.close();
    }

    async compileContract(contractDotSolCode: string, relative_path?) : Promise<string>  {
        let hash;
        if (relative_path !== undefined) {
            hash = this.getHashName(contractDotSolCode);
            await runCommand(consoleTerminal, "sol compile", {
                file: path.resolve(relative_path, hash + '.sol'),
                outputDir: relative_path
            });
        } else {
            hash = this.getHash(contractDotSolCode);
            fs.writeFileSync(path.resolve(globals.TEMP_ROOT, hash + ".sol"), contractDotSolCode);
            await runCommand(consoleTerminal, "sol compile", {
                file: path.resolve(globals.TEMP_ROOT, hash + '.sol'),
                outputDir: globals.TEMP_ROOT
                
            });
        }
        return hash;
    }

    async createContractAccount(contractDotSolCode: string, relative_path?) : Promise<Account> {
        const hash = await this.compileContract(contractDotSolCode, relative_path);

        let abi = await JSON.parse(fs.readFileSync(path.resolve(relative_path || globals.TEMP_ROOT, hash + ".abi.json")).toString());
        let tvc = fs.readFileSync(path.resolve(relative_path || globals.TEMP_ROOT, hash + ".tvc"), {encoding: 'base64'});
        
        const ContractAcc = new Account({
            abi: abi,
            tvc: tvc
        }, {
            signer: signerKeys(everscale_settings.KEYS),
            client: this.client
        });

        if (relative_path == undefined) {
            await this.deleteFiles(hash);
        }
        
        return ContractAcc;
    }

    async deploy(ContractAcc: Account, initInput?: object) : Promise<void> {
        const address = await ContractAcc.getAddress();
        try {
            await ContractAcc.deploy({
                initInput: initInput,
                useGiver: true
            });
            console.log(`Сontract was deployed at address: ${address}`);
        } catch(err) {
            console.error(err);
        }
    }

    async getDecodeTVC(ContractAcc: Account) : Promise<ResultOfDecodeTvc> {
        const tvc = ContractAcc.contract.tvc;
        let decodeTvc;
        if(tvc !== undefined) {
            decodeTvc = await ContractAcc.client.boc.decode_tvc({tvc: tvc});
        }
        return await decodeTvc;
    }

    getDabi(ContractAcc: Account) : string {
        return Buffer.from(JSON.stringify(ContractAcc.contract.abi)).toString('base64');
    }

    private async deleteFiles(hash: string) : Promise<void> {
        fs.unlinkSync(path.resolve(globals.TEMP_ROOT, hash + ".sol"));
        fs.unlinkSync(path.resolve(globals.TEMP_ROOT, hash + ".abi.json"));
        fs.unlinkSync(path.resolve(globals.TEMP_ROOT, hash + ".tvc"));
    }
    
    private getHash(solString: string) : string {
        var hash = 0;
        if (solString.length == 0) return hash.toString();

        for (var i = 0; i < solString.length; i++) {
            var char = solString.charCodeAt(i);
            hash = ( (hash << 5)- hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    private getHashName(solString: string) : string {
        let contractName = solString.substring(solString.indexOf("contract ") + 9, solString.indexOf("{")).split(" ")[0];
        contractName = contractName.charAt(0).toUpperCase() + contractName.slice(1);
        return contractName;
    }
}