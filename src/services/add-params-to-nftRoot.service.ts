import path from 'path'
import fs from 'fs'

import { globals } from '../config/globals'

export type ContractParam = {
    type: string
    name: string
}

const NftRootFileName = path.join(globals.APP_ROOT, '/data-samples/NftRoot.sol')

const markForParamDefenition = '/*%PARAM_DEFENITION%*/'
const markForParamConstructor = '/*%PARAM_CONSTRUCTOR%*/'
const markForParamSet = '/*%PARAM_SET%*/'

class AddParamsToNftRootService {

    async addSingleParamToNftRoot(param: ContractParam) : Promise<void>{

        let paramDefenition = param.type + ' ' + param.name + ';\n\t' + markForParamDefenition;
        let paramConstructor = ', ' + param.type + ' _' + param.name + markForParamConstructor;
        let paramSet = param.name + ' = _' + param.name + ';\n\t\t' + markForParamSet;

        let code_source = fs.readFileSync(NftRootFileName, 'utf8')
        
        code_source = code_source.replace(markForParamDefenition, paramDefenition)
        code_source = code_source.replace(markForParamConstructor, paramConstructor)
        code_source = code_source.replace(markForParamSet, paramSet)
            
        fs.writeFileSync(NftRootFileName, code_source, 'utf8')
            
        console.log('NftRoot has been update');
            
    }

    async addSeveralParamsToNftRoot(paramsArr: ContractParam[]) : Promise<void>{

        paramsArr.forEach(param => {
            addSingleParamToNftRoot(param)
        });

    }

}

export const { addSingleParamToNftRoot } = new AddParamsToNftRootService()
export const { addSeveralParamsToNftRoot } = new AddParamsToNftRootService()