import path from 'path'
import fs from 'fs'

import { globals } from '../config/globals'

const NftRootFileName = path.join(globals.APP_ROOT, '/data-samples/NftRoot.sol')

const markForParamDefenition = '/*%PARAM_DEFENITION%*/'
const markForParamConstructor = '/*%PARAM_CONSTRUCTOR%*/'
const markForParamSet = '/*%PARAM_SET%*/'

class AddParamsToNftRootService {

    async addSingleParamToNftRoot(paramType: string, paramName: string) : Promise<void>{
        
        let paramDefenition = paramType + ' ' + paramName + ';\n\t' + markForParamDefenition;
        let paramConstructor = ', ' + paramType + ' _' + paramName + markForParamConstructor;
        let paramSet = paramName + ' = _' + paramName + ';\n\t\t' + markForParamSet;

        let code_source = fs.readFileSync(NftRootFileName, 'utf8')
        
        code_source = code_source.replace(markForParamDefenition, paramDefenition)
        code_source = code_source.replace(markForParamConstructor, paramConstructor)
        code_source = code_source.replace(markForParamSet, paramSet)
            
        fs.writeFileSync(NftRootFileName, code_source, 'utf8')
            
        console.log('NftRoot has been upgrade');
            
    }

    async addSeveralParamsToNftRoot(paramsArr:Array<[string, string]>) : Promise<void>{

        paramsArr.forEach(paramPair => {
            addSingleParamToNftRoot(paramPair[0], paramPair[1])
        });

    }

}

export const { addSingleParamToNftRoot } = new AddParamsToNftRootService()
export const { addSeveralParamsToNftRoot } = new AddParamsToNftRootService()