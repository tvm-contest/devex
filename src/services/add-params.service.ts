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
const markForDebotParamEnumLength = '/*PARAM_ENUM_LENGTH*/';

const markForRequireType = '/*%REQUIRE_TYPE%*/';
const markForRequireTypeLimit = '/*%REQUIRE_TYPE_LIMIT%*/';
const markForTypePrint = '/*%TYPE_PRINT%*/';
const markForTypeInput = '/*%TYPE_INPUT%*/';

export class AddParamsService {
  async removeNftTypeChecking(rootContractPath : string, debotContractPath : string) : Promise<any> {
    let codeSourceRoot = fs.readFileSync(rootContractPath, 'utf8');
    let codeSourceDebot = fs.readFileSync(debotContractPath, 'utf8');

    codeSourceRoot = codeSourceRoot.replace(markForRequireType, "//");
    codeSourceRoot = codeSourceRoot.replace(markForRequireTypeLimit, "//");
    codeSourceDebot = codeSourceDebot.replace(markForTypePrint, "//");
    codeSourceDebot = codeSourceDebot.replace(markForTypeInput, "//");

    fs.writeFileSync(rootContractPath, codeSourceRoot, 'utf8');
    fs.writeFileSync(debotContractPath, codeSourceDebot, 'utf8');
  }

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
    let enumParameter = "enum Enum" + enumParam.getName() + ' { ' + enumParam.getEnumVariants().toString() + ' } ' + '\n' + markForEnums;
    
    let enumVariants = enumParam.getEnumVariants().toString().split(',');
    let enumsNumbers = '';
    let enumLength = 0;
    for (let i = 0; i < enumVariants.length; i++) {
      enumsNumbers = enumsNumbers + ' ' + (i) + ' - ' + enumVariants[i] + "\\n";
      enumLength++;
    }
    let paramForDebotCheckResult = 'Terminal.print(0, format("Available:\\n ' + enumsNumbers + '\\n ' + enumParam.getName() + ': {}", uint(' + enumParam.getName() + ')));\n\t\t' + markForDebotCheckResult;
    let paramForDebotDeployNftStep2 = 'Terminal.print(0, format("Available:\\n ' + enumsNumbers + '\\n ' + enumParam.getName() + ': {}", uint(_nftParams.' + enumParam.getName() + ')));\n\t\t' + markForDebotDeployNftStep2;
    let paramForDebotSetTypes = 'AmountInput.get(tvm.functionId(nftParamsSet' + enumParam.getName() +'), ' + 
    '"Enter ' + enumParam.getName() + '\\nAvailable: \\n' + enumsNumbers + '(enter the number):",  0, 0, ' + enumParam.getName() + 'Length - 1);\n\t\t' + markForDebotSetTypes;
    let paramForDebotEnumLength = 'uint128 ' + enumParam.getName() + 'Length = ' + enumLength + ';\n' + markForDebotParamEnumLength;

    let functionForDebotSetTypes = 'function nftParamsSet' + enumParam.getName() + '(uint128 value) public {\n' +
    '\t\t_nftParams.' + enumParam.getName() + ' = Enum'+ enumParam.getName() +'(value);\n\t}\n\t' + markForDebotFunctionSetTypes;
    
    codeSource = codeSource.replace(markForEnums, enumParameter);
    codeSource = codeSource.replace(markForDebotCheckResult, paramForDebotCheckResult);
    codeSource = codeSource.replace(markForDebotDeployNftStep2, paramForDebotDeployNftStep2);
    codeSource = codeSource.replace(markForDebotSetTypes, paramForDebotSetTypes);
    codeSource = codeSource.replace(markForDebotFunctionSetTypes, functionForDebotSetTypes);
    codeSource = codeSource.replace(markForDebotParamEnumLength, paramForDebotEnumLength);
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
    if (param.getType() == 'uint') {
      paramForDebotSetTypes = 'AmountInput.get(tvm.functionId(nftParamsSet' + param.getName() + '), ' + 
        '"Enter ' + param.getName() + ' (' + param.getType() + '):",  0, ' + param.getMinValue() + ', ' + param.getMaxValue() + ');\n\t\t' + 
        markForDebotSetTypes;
    } else if (!(param instanceof MediaFile)) {
      paramForDebotSetTypes = 'Terminal.input(' + 
        'tvm.functionId(nftParamsSet' + param.getName() +  '), ' + 
        '"Enter ' + param.getName() + ' (' + param.getType() + '):", false);\n\t\t' + markForDebotSetTypes;
    }
    let functionForDebotSetTypes;
    if (param.getType() == 'string') {
      functionForDebotSetTypes = 'function nftParamsSet' + param.getName() + '(string value) public { _nftParams.' + param.getName() + ' = value;}\n\t' + markForDebotFunctionSetTypes;
    } else if (param.getType() == 'uint') {
      functionForDebotSetTypes = 'function nftParamsSet' + param.getName() + '(uint128 value) public { _nftParams.' + param.getName() + ' = value;}\n\t' + markForDebotFunctionSetTypes;
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
      let paramForDebotDeployNftStep2 = 'Terminal.print(0, format("' + mediafile.getName() + ': {}", _nftParams.' + mediafile.getName() + '));\n\t\t' + markForDebotDeployNftStep2;
      let paramForDebotCheckResult = 'Terminal.print(0, format("' + mediafile.getName() + ': {}",' + mediafile.getName() + '));\n\t\t' + markForDebotCheckResult;
      
      codeSource = codeSource.replace(markForDebotSetTypes, paramForDebotSetTypes);
      codeSource = codeSource.replace(markForDebotDeployNftStep2, paramForDebotDeployNftStep2);
      codeSource = codeSource.replace(markForDebotCheckResult, paramForDebotCheckResult);
    }
        
    fs.writeFileSync(outputContractFile, codeSource, 'utf8');
  }
}