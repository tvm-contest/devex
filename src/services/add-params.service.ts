import fs from 'fs'

import { Parametr } from '../models/parametr'
import { EnumParameter } from '../models/enum'

const markForParamDefenition = '/*%PARAM_DEFENITION%*/'
const markForParamConstructor = '/*%PARAM_CONSTRUCTOR%*/'
const markForParamSet = '/*%PARAM_SET%*/'
const markForParamToData = '/*%PARAM_TO_DATA%*/'
const markForParamToMint = '/*%PARAM_TO_MINT%*/'
const markForEnums = '/*ENUMS*/'

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

  async addEnums(enums: EnumParameter[], inputContractFile: string, outputContractFile?: string) : Promise<void> {
    if (!outputContractFile) outputContractFile = inputContractFile;

    let codeSource = fs.readFileSync(inputContractFile, 'utf8');
    for (let enumParam of enums) {
      codeSource = await this.addEnum(enumParam, codeSource);
    }
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8')
  }

  private async addEnum(enumParam: EnumParameter, codeSource: string) : Promise<string> {
    let enumParameter = "enum " + enumParam.getName() + ' { ' + enumParam.getEnumVariants().toString() + ' } ' + '\n' + markForEnums;
    return codeSource.replace(markForEnums, enumParameter);
  }

  private async addParam(param: Parametr, codeSource: string)  : Promise<string>{

    let paramDefenition = param.getType() + ' ' + param.getName() + ';\n\t' + markForParamDefenition;
    let paramConstructor = ', ' + param.getType() + ' _' + param.getName() + markForParamConstructor;
    let paramSet = param.getName() + ' = _' + param.getName() + ';\n\t\t' + markForParamSet;
    let paramToData = ', ' + param.getName() + markForParamToData;
    let paramToMint = ', ' + param.getType() + ' ' + param.getName() + markForParamToMint;

    codeSource = codeSource.replace(markForParamDefenition, paramDefenition)
    codeSource = codeSource.replace(markForParamConstructor, paramConstructor)
    codeSource = codeSource.replace(markForParamSet, paramSet)
    codeSource = codeSource.replace(markForParamToData, paramToData)
    codeSource = codeSource.replace(markForParamToMint, paramToMint)

    return codeSource;

  }

}