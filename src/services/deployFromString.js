const {TonClient, signerKeys, BocModule} = require("@tonclient/core");
const {libNode} = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { consoleTerminal, runCommand, downloadFromGithub} = require("tondev");
const fs = require('fs');
const crypto = require('crypto');
const path = require("path");

//const { globals } = require ('../config/globals');


class TestDeployFromString {
    #client;
    #hash = '';
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

        this.setHash(solString);

        //Create .sol file
        fs.writeFileSync(`${this.#testFolder}\\${this.#hash}.sol`, solFile, function (err) {
            if (err) return console.log(err);
         });

        //Compile
        await runCommand(consoleTerminal, "sol compile", {
            file: `${this.#testFolder}\\${this.#hash}.sol`
         });

         //Костыль для переноса в папку temp (исправлю, как разберусь перенаправить итог компиляции)
         fs.renameSync(`${this.#hash}.abi.json`, `${this.#testFolder}\\${this.#hash}.abi.json`, function (err) {
            if (err) console.log(err)
          })

          fs.renameSync(`${this.#hash}.tvc`, `${this.#testFolder}\\${this.#hash}.tvc`, function (err) {
            if (err) console.log(err)
          })
     }

    
     
     async deployMethod(solString) {

        // if (this.#hash == '') {
        //     return new Error("Can't deploy without compiled files")
        // }

        const compile = await this.compileMethod(solString);
        
        const AccContract = {
            abi: JSON.parse(fs.readFileSync(`${this.#testFolder}\\${this.#hash}.abi.json`)),
            tvc: fs.readFileSync(`${this.#testFolder}\\${this.#hash}.tvc`, {encoding: 'base64'}),
        };
        
        //Сформировываем связку ключей
        //const keys = await this.#client.crypto.generate_random_sign_keys();

        //json связки ключей
        const signer = signerKeys(this.#keys);

        const client = this.#client;

        //предварительно создаем контракт
        const acc = new Account(AccContract, { signer, client });

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



     async getTvcDecode() {
        //Сформировываем tvc_decode для экспорта
        const tvc_string = fs.readFileSync(`${this.#testFolder}\\${this.#hash}.tvc`, {encoding: 'base64'});
        const boc = new BocModule(this.#client);
        const temp = await boc.decode_tvc({ tvc: tvc_string});

        //fs.writeFileSync(this.#hash + ".decode.json", JSON.stringify(temp, null, '\t'));

        return  JSON.stringify(temp, null, '\t');
    }

    async getDabi() {
        const abi =  await JSON.parse(fs.readFileSync(`${this.#testFolder}\\${this.#hash}.abi.json`));

        const dabi =  {
            dabi: Buffer.from(JSON.stringify(abi)).toString('base64'),
        };

        //fs.writeFileSync(this.#hash + ".dabi.json", JSON.stringify(dabi, null, '\t'));

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


    setHash(solString) {
        this.#hash = crypto.createHash('md5').update(solString).digest('hex');
    }

    getName() {
        return this.#hash;
    }

} //end class



const solString = "pragma ton-solidity >= 0.35.0; pragma AbiHeader expire; contract helloworld {function renderHelloWorld () public pure returns (string) {return 'helloWorld';}}";

let d = new TestDeployFromString();
// d.compileMethod();
d.compileMethod(solString);
// console.log(d.getTvcDecode());
// console.log(d.getDabi());
// d.close();