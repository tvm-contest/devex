
import path from 'path';
import { consoleTerminal, runCommand } from 'tondev';
import { Account } from '@tonclient/appkit';
import { TonClient, signerKeys, BocModule, ResultOfDecodeTvc } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import * as fs from 'fs';
import { globals } from '../config/globals'


const COMPILE_PATH = path.resolve(globals.BASE_PATH, "temp");
const KEYS  = {
    public: "af0115f94c93848ac16afb811e3bb992116b0b85f9a2ac618adae56b5f4e2039",
    secret: "c0152d49dee1e48791f1e4c749abdd1be0026cd2042db21f8ca65d8e905cc87d"  
};

export class DeployService {
    private client: TonClient;
    private readonly endpoints = "http://localhost";

    constructor(){
        TonClient.useBinaryLibrary(libNode);

        this.client = new TonClient({
            network: {
                endpoints: [this.endpoints]
            }
        });

        if (!fs.existsSync(COMPILE_PATH)){
            fs.mkdirSync(COMPILE_PATH);
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
            fs.writeFileSync(path.resolve(COMPILE_PATH, hash + ".sol"), contractDotSolCode);
            await runCommand(consoleTerminal, "sol compile", {
                file: path.resolve(COMPILE_PATH, hash + '.sol'),
                outputDir: COMPILE_PATH
                
            });
        }
        return hash;
    }

    async createContractAccount(contractDotSolCode: string, relative_path?) : Promise<Account> {
        const hash = await this.compileContract(contractDotSolCode, relative_path);

        let abi = await JSON.parse(fs.readFileSync(path.resolve(relative_path || COMPILE_PATH, hash + ".abi.json")).toString());
        let tvc = fs.readFileSync(path.resolve(relative_path || COMPILE_PATH, hash + ".tvc"), {encoding: 'base64'});
        
        const ContractAcc = new Account({
            abi: abi,
            tvc: tvc
        }, {
            signer: signerKeys(KEYS),
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
        fs.unlinkSync(path.resolve(COMPILE_PATH, hash + ".sol"));
        fs.unlinkSync(path.resolve(COMPILE_PATH, hash + ".abi.json"));
        fs.unlinkSync(path.resolve(COMPILE_PATH, hash + ".tvc"));
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