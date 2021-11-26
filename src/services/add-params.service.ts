import fs from 'fs'

import { Parametr } from '../models/parametr'

const markForParamDefenition = '/*%PARAM_DEFENITION%*/'
const markForParamConstructor = '/*%PARAM_CONSTRUCTOR%*/'
const markForParamSet = '/*%PARAM_SET%*/'
const markForParamToData = '/*%PARAM_TO_DATA%*/'

class AddParamsService {

    async addSingleParam(param: Parametr, inputContract: string, outputContract?: string) : Promise<void>{

        if (!outputContract) outputContract = inputContract;

        let codeSource = fs.readFileSync(inputContract, 'utf8')
        codeSource = await AddParamsService.addParam(param, codeSource)
            
        fs.writeFileSync(outputContract, codeSource, 'utf8')
            
    }

    async addSeveralParams(paramsArr: Parametr[], inputContract: string, outputContract?: string) : Promise<void>{

        if (!outputContract) outputContract = inputContract;

        let codeSource = fs.readFileSync(inputContract, 'utf8')
        for (let param of paramsArr) {
            codeSource = await AddParamsService.addParam(param, codeSource)
        }
            
        fs.writeFileSync(outputContract, codeSource, 'utf8')

    }

    private static async addParam(param: Parametr, codeSource: string)  : Promise<string>{

        let paramDefenition = param.getType() + ' ' + param.getName() + ';\n\t' + markForParamDefenition;
        let paramConstructor = ', ' + param.getType() + ' _' + param.getName() + markForParamConstructor;
        let paramSet = param.getName() + ' = _' + param.getName() + ';\n\t\t' + markForParamSet;
        let paramToData = ', ' + param.getName() + markForParamToData;

        codeSource = codeSource.replace(markForParamDefenition, paramDefenition)
        codeSource = codeSource.replace(markForParamConstructor, paramConstructor)
        codeSource = codeSource.replace(markForParamSet, paramSet)
        codeSource = codeSource.replace(markForParamToData, paramToData)

        return codeSource;

    }

}

export const { addSingleParam } = new AddParamsService()
export const { addSeveralParams } = new AddParamsService()