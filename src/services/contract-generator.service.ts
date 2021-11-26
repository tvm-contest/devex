import path from 'path'
import fs from 'fs'
import { sha256 } from 'js-sha256';

import { globals } from '../config/globals'
import { Collection } from "../models/collection";
import { addSeveralParams } from './add-params.service';

const dataFile = path.join(globals.CONTRACTS_ROOT, 'Data.sol');
const indexFile = path.join(globals.CONTRACTS_ROOT, 'Index.sol');
const indexBasisFile = path.join(globals.CONTRACTS_ROOT, 'IndexBasis.sol');
const nftRootFile = path.join(globals.CONTRACTS_ROOT, 'NftRoot.sol');
const interfacesDir = path.join(globals.CONTRACTS_ROOT, 'interfaces');
const librariesDir = path.join(globals.CONTRACTS_ROOT, 'libraries');
const resolversDir = path.join(globals.CONTRACTS_ROOT, 'resolvers');

class ContractGenerator {

    generateContract(contract : Collection){
        const hashContract = sha256(JSON.stringify(contract));
        const tempDir = path.join(globals.TEMP_ROOT, hashContract)

        const dataFileTepm = path.join(tempDir, 'Data.sol');
        const indexFileTepm = path.join(tempDir, 'Index.sol');
        const indexBasisFileTepm = path.join(tempDir, 'IndexBasis.sol');
        const nftRootFileTepm = path.join(tempDir, 'NftRoot.sol');
        const interfacesDirTepm = path.join(tempDir, 'interfaces');
        const librariesDirTepm = path.join(tempDir, 'libraries');
        const resolversDirTepm = path.join(tempDir, 'resolvers');

        fs.mkdirSync(tempDir);

        fs.cpSync(interfacesDir, interfacesDirTepm, {recursive: true});
        fs.cpSync(librariesDir, librariesDirTepm, {recursive: true});
        fs.cpSync(resolversDir, resolversDirTepm, {recursive: true});
        fs.copyFileSync(indexFile, indexFileTepm);
        fs.copyFileSync(indexBasisFile, indexBasisFileTepm);

        if (contract.getParameters().length == 0) {
            fs.copyFileSync(nftRootFile, nftRootFileTepm);
            fs.copyFileSync(dataFile, dataFileTepm);
        } else {
            addSeveralParams(contract.getParameters(), nftRootFile, nftRootFileTepm);
            addSeveralParams(contract.getParameters(), dataFile, dataFileTepm);
        }

    }

    deleteContractDirTemp(contract : Collection){
        const hashContract = sha256(JSON.stringify(contract));
        const tempDir = path.join(globals.TEMP_ROOT, hashContract)

        fs.access(tempDir, fs.constants.F_OK, (err) => {
            if (err){
                console.log("Временной папки для данного контракта нет")
            } else {
                fs.rm(tempDir, {recursive: true, force: true}, ()=>{
                    console.log(`Временный файл ${hashContract} удален`)
                })
            }
        });
    }

}

export const { generateContract } = new ContractGenerator()
export const { deleteContractDirTemp } = new ContractGenerator()