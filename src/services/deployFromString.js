const {TonClient, signerKeys, BocModule} = require("@tonclient/core");
const {libNode} = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { consoleTerminal, runCommand, downloadFromGithub} = require("tondev");
const fs = require('fs');
const crypto = require('crypto');
const path = require("path");


//import { globals } from '../config/globals'


class DeployFromString {
    #client;
    #testFolder = 'temp';
    #keys  = {
        secret: "f6d2b219db1bcccd8ed38c82a5037cfe41db08b4cca1832b52de8fda33a22dca",
        public: "24379d4a9d8f16b292bc814f492762e43de69c5d472435e68753cd22f1f50eee"     
    }
    #endpoints = "http://localhost";



     constructor(){
        TonClient.useBinaryLibrary(libNode);


        this.#client = new TonClient({
            network: {
                endpoints: [this.#endpoints]
            }
        });

        if (!fs.existsSync(this.#testFolder)){
            fs.mkdirSync(this.#testFolder);
        }
     }


     async compileMethod(solString) {

        const hash = await this.getHash(solString);

        //Create .sol file
        fs.writeFileSync(`${this.#testFolder}\\${hash}.sol`, solString, function (err) {
            if (err) return console.log(err);
         });

        //Compile
        await runCommand(consoleTerminal, "sol compile", {
            file: `${this.#testFolder}\\${hash}.sol`,
            outputDir: `${this.#testFolder}\\`
            
         });
     }
     

     async createContractAccount(solString) {

        const hash = await this.getHash(solString);
        const compile = await this.compileMethod(solString);

        const AccContract = {
            abi: JSON.parse(fs.readFileSync(`${this.#testFolder}\\${hash}.abi.json`)),
            tvc: fs.readFileSync(`${this.#testFolder}\\${hash}.tvc`, {encoding: 'base64'}),
        };

        const keys = await this.#client.crypto.generate_random_sign_keys();
        const signer = signerKeys(keys);

        const client = this.#client;

        //формируем контракт
        const acc = new Account(AccContract, { signer, client });

        return acc;

     }

    
     
     async deployMethod(solString) {

        const acc = await this.createContractAccount(solString);

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



     async getTvcDecode(solString) {
        //Сформировываем tvc_decode для экспорта
 
        const acc = await this.createContractAccount(solString);

        const boc = new BocModule(this.#client);
        const temp = await boc.decode_tvc({ tvc: acc.contract.tvc});


        return  JSON.stringify(temp, null, '\t');
    }

    async getDabi() {


        const acc = await this.createContractAccount(solString);

        const dabi =  {
            dabi: Buffer.from(JSON.stringify(acc.contract.abi)).toString('base64'),
        };

        return JSON.stringify(dabi, null, '\t');

    }

  

    async close(){

       this.#client.close();

       //delete all files from temp
       const deleteFile = await fs.readdir(this.#testFolder, (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlinkSync(path.join(this.#testFolder, file), err => {
            if (err) throw err;
          });
        }
        fs.open(`${this.#testFolder}/.gitkeep`, 'w', 
        function (err) { 
        });
      });

    } //end close


    getHash(solString) {
        const hash = crypto.createHash('md5').update(solString).digest('hex');
        return hash;
    }


} //end class



const solString = "pragma ton-solidity >= 0.35.0; pragma AbiHeader expire; contract helloworld {function renderHelloWorld () public pure returns (string) {return 'helloWorld';}}";

let d = new DeployFromString(); 
//d.deployMethod(solString);
//d.compileMethod(solString);
//console.log(d.getTvcDecode(solString));
 //console.log(d.getDabi());
 //d.close();