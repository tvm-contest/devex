const {TonClient, signerKeys, BocModule} = require("@tonclient/core");
const {libNode} = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { consoleTerminal, runCommand, downloadFromGithub} = require("tondev");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');
const { globals } = require ('../config/globals');



class TestDeployFromString {
    #client;
    #hash;
    #dir

     constructor(solFile, network){
        TonClient.useBinaryLibrary(libNode);

        const temp = crypto.createHash('md5').update(solFile).digest('hex');

        this.#hash =  temp + '/' + temp;

        this.#client = new TonClient({
            network: {
                endpoints: [network]
            }
        });

        if (!fs.existsSync(temp)){
            fs.mkdirSync(temp);
        }



     }

     async compileMethod() {

        //Create .sol file
        fs.writeFileSync(this.#hash + ".sol", solFile, function (err) {
            if (err) return console.log(err);
         });

        //Compile
        await runCommand(consoleTerminal, "sol compile", {
            file: path.resolve( __dirname + "\\" + "4120707e7e06c7607319cffa1262a25b" , "4120707e7e06c7607319cffa1262a25b.sol")
         });
  
     
     }

    
     
     async deployMethod() {


        const AccContract = {
            abi: JSON.parse(fs.readFileSync(this.#hash + ".abi.json")),
            tvc: fs.readFileSync(this.#hash + ".tvc", {encoding: 'base64'}),
        };

        //Сформировываем связку ключей
        const keys = await this.#client.crypto.generate_random_sign_keys();

        //json связки ключей
        const signer = signerKeys(keys);

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
        const tvc_string = fs.readFileSync(this.#hash + ".tvc", {encoding: 'base64'});
        const boc = new BocModule(this.#client);
        const temp = await boc.decode_tvc({ tvc: tvc_string});
        //fs.writeFileSync(this.#hash + ".decode.json", JSON.stringify(temp, null, '\t'));

        return  JSON.stringify(temp, null, '\t');
    }

    async getDabi() {
        const abi =  await JSON.parse(fs.readFileSync(this.#hash + ".abi.json"));

        const dabi =  {
            dabi: Buffer.from(JSON.stringify(abi)).toString('base64'),
        };

        //fs.writeFileSync(this.#hash + ".dabi.json", JSON.stringify(dabi, null, '\t'));

        return  JSON.stringify(dabi, null, '\t');

    }

    getName() {
        return  this.#hash;
    }

    close(){
        this.#client.close();

    }





} //end class


const endpoints = "http://localhost"
const solFile = "pragma ton-solidity >= 0.35.0; pragma AbiHeader expire; contract helloworld {function renderHelloWorld () public pure returns (string) {return 'helloWorld';}}";

let d = new TestDeployFromString(solFile, endpoints);
d.compileMethod();
// d.deployMethod();
// d.close();
// d.getTvcDecode();
// d.getDabi();