import path from 'path'
import fs from 'fs'

import { globals } from '../config/globals'

const NftRootFileName = path.join(globals.APP_ROOT, '/src/nft/NftRoot.sol')

class AddParamsToNftRootService {
    async addSingleParamToNftRoot(paramType: string, paramName: string) : Promise<void>{
        
        const paramDefenition = paramType + ' ' + paramName + ';\n\t/*%PARAM_DEFENITION%*/'
        const paramConstructor = ', ' + paramType + ' _' + paramName+'/*%PARAM_CONSTRUCTOR%*/'
        const paramSet = paramName + ' = _' + paramName + ';\n\t\t/*%PARAM_SET%*/'

        let code_source = fs.readFileSync(NftRootFileName, 'utf8')
        
        code_source = code_source.replace(/\/\*%PARAM_DEFENITION%\*\//, paramDefenition)
        code_source = code_source.replace(/\/\*%PARAM_CONSTRUCTOR%\*\//, paramConstructor)
        code_source = code_source.replace(/\/\*%PARAM_SET%\*\//, paramSet)
            
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