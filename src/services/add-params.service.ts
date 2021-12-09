import fs from 'fs'

import { Parametr } from '../models/parametr';
import { EnumParameter } from '../models/enum';
import { MediaFile } from '../models/mediafile';

const markForParamDefenition = '/*%PARAM_DEFENITION%*/';
const markForParamConstructor = '/*%PARAM_CONSTRUCTOR%*/';
const markForParamSet = '/*%PARAM_SET%*/';
const markForParamToData = '/*%PARAM_TO_DATA%*/';
const markForParamToDataInfo = '/*%PARAM_DATA_INFO%*/';
const markForParamSetToDataInfo = '/*PARAM_SET_DATA_INFO*/';
const markForParamToMint = '/*%PARAM_TO_MINT%*/';
const markForEnums = '/*ENUMS*/';
const markForDebotMint = '/*PARAM_TO_DEBOT_MINT*/';
const markForDebotCheckResult = '/*TERMINAL_CHECK_RESULT*/';
const markForDebotDeployNftStep2 = '/*TERMINAL_TO_DEPLOY_NFT_STEP_2*/';
const markForDebotSetTypes = '/*TERMINAL_FOR_DEBOT_SET_TYPES*/';
const markForDebotFunctionSetTypes = '/*FUNCTION_FOR_DEBOT_SET_TYPES*/';

export class AddParamsService {

  async addSingleParam(param: Parametr, inputContractFile: string, outputContractFile?: string) : Promise<void>{

    if (!outputContractFile) {
      outputContractFile = inputContractFile;
    }

    let codeSource = fs.readFileSync(inputContractFile, 'utf8');
    codeSource = await this.addParam(param, codeSource);
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8');
          
  }

  async addSeveralParams(paramsArr: Parametr[], inputContractFile: string, outputContractFile?: string) : Promise<void>{

    if (!outputContractFile) outputContractFile = inputContractFile;

    let codeSource = fs.readFileSync(inputContractFile, 'utf8');
    for (let param of paramsArr) {
      codeSource = await this.addParam(param, codeSource);
    }
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8');

  }

  async addEnums(enums: EnumParameter[], inputContractFile: string, outputContractFile?: string) : Promise<void> {
    if (!outputContractFile) outputContractFile = inputContractFile;

    let codeSource = fs.readFileSync(inputContractFile, 'utf8');
    for (let enumParam of enums) {
      codeSource = await this.addEnum(enumParam, codeSource);
    }
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8');
  }

  private async addEnum(enumParam: EnumParameter, codeSource: string) : Promise<string> {
    let enumParameter = "enum " + enumParam.getName() + ' { ' + enumParam.getEnumVariants().toString() + ' } ' + '\n' + markForEnums;
    

    let enumVariants = enumParam.getEnumVariants().toString().split(',');
    let enumsNumbers = '';
    for (let i = 0; i < enumVariants.length; i++) {
      enumsNumbers = enumsNumbers + ' ' + (i+1) + ' - ' + enumVariants[i];
    }
    let paramForDebotCheckResult = 'Terminal.print(0, format("Available: ' + enumsNumbers + '\\n enum' + enumParam.getName() + ': {}", uint(enum' + enumParam.getName() + ')));\n\t\t' + markForDebotCheckResult;
    let paramForDebotDeployNftStep2 = 'Terminal.print(0, format("Available: ' + enumsNumbers + '\\n enum' + enumParam.getName() + ': {}", uint(_nftParams.enum' + enumParam.getName() + ')));\n\t\t' + markForDebotDeployNftStep2;
    let paramForDebotSetTypes = 'Terminal.input(' + 
    'tvm.functionId(nftParamsSetenum' + enumParam.getName() +'), ' + 
    '"Enter ' + enumParam.getName() + '\\nAvailable: ' + enumsNumbers + '(enter the number):", false);\n\t\t' + markForDebotSetTypes;

    let functionForDebotSetTypes = 'function nftParamsSetenum' + enumParam.getName() + '(string value) public {\n' +
    '\t\t(uint i,) = stoi(value);\n' +
    '\t\t_nftParams.enum' + enumParam.getName() + ' = '+ enumParam.getName() +'(i);\n\t}\n\t' + markForDebotFunctionSetTypes;
    
    codeSource = codeSource.replace(markForEnums, enumParameter);
    codeSource = codeSource.replace(markForDebotCheckResult, paramForDebotCheckResult);
    codeSource = codeSource.replace(markForDebotDeployNftStep2, paramForDebotDeployNftStep2);
    codeSource = codeSource.replace(markForDebotSetTypes, paramForDebotSetTypes);
    codeSource = codeSource.replace(markForDebotFunctionSetTypes, functionForDebotSetTypes);
    return codeSource;
  }

  private async addParam(param: Parametr, codeSource: string)  : Promise<string>{

    let paramDefenition = param.getType() + ' ' + param.getName() + ';\n\t' + markForParamDefenition;
    let paramConstructor = ', \n\t\t' + param.getType() + ' _' + param.getName() + markForParamConstructor;
    let paramSet = param.getName() + ' = _' + param.getName() + ';\n\t\t' + markForParamSet;
    let paramToData = ', \n\t\t\t' + param.getName() + markForParamToData;
    let paramToDataInfo = ', \n\t\t' + param.getType() + ' _' + param.getName() + markForParamToDataInfo;
    let paramSetToDataInfo = '_' + param.getName() + ' = ' + param.getName() + ';\n\t\t' + markForParamSetToDataInfo;
    let paramToMint = ', \n\t\t' + param.getType() + ' ' + param.getName() + markForParamToMint;
    let paramToDebotMint = ', \n\t\t\t' + '_nftParams.' + param.getName() + markForDebotMint;
    let paramForDebotCheckResult = 'Terminal.print(0, format("' + param.getName() + ': {}",' + param.getName() + '));\n\t\t' + markForDebotCheckResult;
    let paramForDebotDeployNftStep2 = 'Terminal.print(0, format("' + param.getName() + ': {}", _nftParams.' + param.getName() + '));\n\t\t' + markForDebotDeployNftStep2;
    let paramForDebotSetTypes;
    if (!(param instanceof MediaFile)) {
      paramForDebotSetTypes = 'Terminal.input(' + 
        'tvm.functionId(nftParamsSet' + param.getName() +  '), ' + 
        '"Enter ' + param.getName() + ' (' + param.getType() + '):", false);\n\t\t' + markForDebotSetTypes;
    }
    let functionForDebotSetTypes;
    if (param.getType() == 'string') {
      functionForDebotSetTypes = 'function nftParamsSet' + param.getName() + '(string value) public { _nftParams.' + param.getName() + ' = value;}\n\t' + markForDebotFunctionSetTypes;
    } else if (param.getType() == 'uint') {
      functionForDebotSetTypes = 'function nftParamsSet' + param.getName() + '(string value) public { (_nftParams.' + param.getName() + ',) = stoi(value);}\n\t' + markForDebotFunctionSetTypes;
    } else {
      functionForDebotSetTypes = markForDebotFunctionSetTypes;
    }

    codeSource = codeSource.replace(markForParamDefenition, paramDefenition);
    codeSource = codeSource.replace(markForParamConstructor, paramConstructor);
    codeSource = codeSource.replace(markForParamSet, paramSet);
    codeSource = codeSource.replace(markForParamToData, paramToData);
    codeSource = codeSource.replace(markForParamToDataInfo, paramToDataInfo);
    codeSource = codeSource.replace(markForParamSetToDataInfo, paramSetToDataInfo);
    codeSource = codeSource.replace(markForParamToMint, paramToMint);
    codeSource = codeSource.replace(markForDebotMint, paramToDebotMint);
    if ((param.getType() == "string" || param.getType() == "uint") && !(param instanceof MediaFile)) {
      codeSource = codeSource.replace(markForDebotCheckResult, paramForDebotCheckResult);
      codeSource = codeSource.replace(markForDebotDeployNftStep2, paramForDebotDeployNftStep2);
      codeSource = codeSource.replace(markForDebotSetTypes, paramForDebotSetTypes);
    }
    codeSource = codeSource.replace(markForDebotFunctionSetTypes, functionForDebotSetTypes);

    return codeSource;
  }

  async addMediaFiles(mediafiles: MediaFile[], inputContractFile: string, outputContractFile?: string) {
    if (!outputContractFile) outputContractFile = inputContractFile;

    let codeSource = fs.readFileSync(inputContractFile, 'utf8');
    for (let mediafile of mediafiles) {
      let paramForDebotSetTypes = 'Terminal.input(' + 
        'tvm.functionId(nftParamsSet' + mediafile.getName() +  '), ' + 
        '"Enter ' + mediafile.getName() + '(link to the IPFS where the media file is stored):", false);\n\t\t' + markForDebotSetTypes;
      codeSource = codeSource.replace(markForDebotSetTypes, paramForDebotSetTypes);
    }
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8');
  }
}