//todo удалить файл со временем
import path from 'path';
import { consoleTerminal, runCommand } from 'tondev';
import { Account } from '@tonclient/appkit';
import { TonClient, signerKeys, BocModule, ResultOfDecodeTvc } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import * as fs from 'fs';
import { globals } from '../config/globals'

const ROOT_TEST = globals.APP_ROOT + '/src/services/temp';
const KEYS  = {
    secret: "f6d2b219db1bcccd8ed38c82a5037cfe41db08b4cca1832b52de8fda33a22dca",
    public: "24379d4a9d8f16b292bc814f492762e43de69c5d472435e68753cd22f1f50eee"     
}

export class DeployFromString {
    private client: TonClient;
    private readonly endpoints = "http://localhost";

     constructor(){
        TonClient.useBinaryLibrary(libNode);

        this.client = new TonClient({
            network: {
                endpoints: [this.endpoints]
            }
        });

        if (!fs.existsSync(ROOT_TEST)){
            fs.mkdirSync(ROOT_TEST);
        }
     }


     async compileMethod(solString: string) : Promise<number>  {

        const hash = this.getHash(solString);

        //Create .sol file
        fs.writeFileSync(`${ROOT_TEST}\\${hash}.sol`, solString);

        //Compile
        await runCommand(consoleTerminal, "sol compile", {
            file: `${ROOT_TEST}\\${hash}.sol`,
            outputDir: `${ROOT_TEST}\\`
            
         });
         
         //Вернуть имя файлов
         return hash;
     }
     

     async createContractAccount(solString: string) : Promise<Account> {

        const hash =  await this.compileMethod(solString);

        const abi = JSON.parse(fs.readFileSync(`${ROOT_TEST}\\${hash}.abi.json`).toString());
        const tvc = fs.readFileSync(`${ROOT_TEST}\\${hash}.tvc`, {encoding: 'base64'});

        const AccContract = {
            abi: abi,
            tvc: tvc,
        };

        //поменять при необходимости на this.keys
        //const keys = await this.client.crypto.generate_random_sign_keys();

        const signer = signerKeys(KEYS);
        const client = this.client;

        //формируем контракт
        const acc = new Account(AccContract, { signer, client });

        return  acc;

     }

     async deployMethod(acc: Account) : Promise<void> {

        //получаем адрес будущего контракта
        const address = await acc.getAddress();

        console.log(`New account future address: ${address}`);

        //Деплоим
        try {
            await acc.deploy({ useGiver: true });
        } catch(err) {
            console.error(err);
        } finally {
            console.log(`Hello contract was deployed at address: ${address}`);
        }
     } //end methoddeploy



     async getTvcDecode(acc: Account): Promise<ResultOfDecodeTvc> {
        //Сформировываем tvc_decode для экспорта

        const boc = new BocModule(this.client);
        const tvc = acc.contract.tvc;
        let decode_tvc;

        if(tvc !== undefined) {
            decode_tvc = await boc.decode_tvc({tvc: tvc});
        }
        return  await decode_tvc;
    } //end getTvcDecode

    async getDabi(acc: Account): Promise<string> {
        //Сформировываем getDabi для экспорта

        const dabi =  {
            dabi: Buffer.from(JSON.stringify(acc.contract.abi)).toString('base64'),
        };
        return  JSON.stringify(dabi, null, '\t');
    }

    async close(){

       this.client.close();

       //delete all files from temp
       const deleteFile = await fs.readdir(ROOT_TEST, (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlinkSync(path.join(ROOT_TEST, file));
        }
        fs.open(`${ROOT_TEST}/.gitkeep`, 'w', 
        function (err) { 
        });
      });
    } //end close

     getHash(solString: string): number {
        var hash = 0;
        if (solString.length == 0) return hash;

        for (var i = 0; i < solString.length; i++) {
            var char = solString.charCodeAt(i);
            hash = ( (hash << 5)- hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }


} //end class