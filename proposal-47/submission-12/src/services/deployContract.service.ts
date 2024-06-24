import { consoleTerminal, runCommand } from 'tondev';
import { Account} from '@tonclient/appkit';
import { TonClient, signerKeys, ResultOfDecodeTvc } from '@tonclient/core';
import { walletSettings } from '../config/walletKey';
import { libNode } from '@tonclient/lib-node';
import fs from 'fs';
import path from 'path';
import { globals } from '../config/globals';

TonClient.useBinaryLibrary(libNode);

export class DeployContractService {

    private readonly client: TonClient;

    constructor() {

        let settings = JSON.parse(fs.readFileSync(globals.SETTINGS_PATH).toString());
        this.client = new TonClient({
            network: {
                server_address: settings.NETWORK
            }
        });

    }

    async getCurrentWallet() : Promise<Account> {

        const giverContract = {
            abi: await JSON.parse(walletSettings.ABI),
            tvc: walletSettings.TVC,
        };

        let settings = JSON.parse(fs.readFileSync(globals.SETTINGS_PATH).toString());
        const signer = signerKeys(settings.KEYS); 
        let client = this.client;

        const giverAccount = new Account(giverContract, {
            address: settings.WALLETADDRESS, 
            signer,
            client});
 
        return giverAccount;
    }


    async compileContract(
        contractCode: string,
        compilationPath: string,
        nameFile?: string) : Promise<string> {

        let contractName: string;
        if (nameFile == undefined) {
            contractName = contractCode.substring(contractCode.indexOf("contract ") + 9, contractCode.indexOf("{")).split(" ")[0];
        } else contractName = nameFile;

        let contractNameSol = path.join(compilationPath, '/' + contractName + ".sol");

        try {
            await runCommand(consoleTerminal, "sol compile", {
            file: contractNameSol,
            outputDir: compilationPath
            });
        }  catch(err) {
            console.log(err);
        }

        return contractName;

    }


    async createAccount(
        contractName: string,
        compilationPath: string
        ) : Promise<Account>{

        const tvc = fs.readFileSync(path.resolve(compilationPath, contractName + ".tvc"), {encoding: 'base64'});
        const abi = await JSON.parse(fs.readFileSync(path.resolve(compilationPath, contractName + '.abi.json')).toString());
        const keys = await TonClient.default.crypto.generate_random_sign_keys();

        const contractAcc = new Account({
            abi: abi,
            tvc: tvc,
        }, {
            signer: signerKeys(keys),
            client: this.client,
        });
        return contractAcc;
    }

    async deployContract({
        initInput, 
        account,
        valueTON }) : Promise<void> {

        const walletAcc = await this.getCurrentWallet();
        const addressAccount = await account.getAddress();

        try {
            
            walletAcc.run(
                "sendTransaction",
                {
                    dest: addressAccount,
                    value: valueTON,
                    flags: 2,
                    bounce: false,
                    payload: "",
                }
            );


            const { acc_type } = await account.getAccount();
            if (acc_type !== 1) {
            await account.deploy({
                initFunctionName: "constructor",
                initInput
            });
            }
        } catch(error) {
            console.log(error)
        }

    }

    async getContractAddress(
        contractAcc: Account
        ) : Promise<string> {

        const address = await contractAcc.getAddress();
        return address;

    }

    async getContractDabi(
        contractAcc: Account
        ) : Promise<string>{

        return Buffer.from(JSON.stringify(contractAcc.contract.abi)).toString('base64');
    }

    async getContractCode(
        contractAcc: Account
        ) : Promise<ResultOfDecodeTvc> {

        const tvc = contractAcc.contract.tvc;
        let decodedTvc;
        if(tvc !== undefined) {
            decodedTvc = await contractAcc.client.boc.decode_tvc({tvc: tvc});
        }
        return decodedTvc;
    }

}