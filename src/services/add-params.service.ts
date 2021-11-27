import fs from 'fs'

import { Parametr } from '../models/parametr'

const markForParamDefenition = '/*%PARAM_DEFENITION%*/'
const markForParamConstructor = '/*%PARAM_CONSTRUCTOR%*/'
const markForParamSet = '/*%PARAM_SET%*/'
const markForParamToData = '/*%PARAM_TO_DATA%*/'

export class AddParamsService {

  async addSingleParam(param: Parametr, inputContractFile: string, outputContractFile?: string) : Promise<void>{

    if (!outputContractFile) {
      outputContractFile = inputContractFile;
    }

    let codeSource = fs.readFileSync(inputContractFile, 'utf8')
    codeSource = await this.addParam(param, codeSource)
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8')
          
  }

  async addSeveralParams(paramsArr: Parametr[], inputContractFile: string, outputContractFile?: string) : Promise<void>{

    if (!outputContractFile) outputContractFile = inputContractFile;

    let codeSource = fs.readFileSync(inputContractFile, 'utf8')
    for (let param of paramsArr) {
      codeSource = await this.addParam(param, codeSource)
    }
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8')

  }

  private async addParam(param: Parametr, codeSource: string)  : Promise<string>{

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