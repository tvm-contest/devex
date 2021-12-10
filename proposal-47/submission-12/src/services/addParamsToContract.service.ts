import { Param } from "../models/param-model";

class AddParamsToNftRootConstructor {

    insertAbi(codeSource: string, abi: string) {
        const abiTeg = '/*ABI*/';
        codeSource = codeSource.replace(abiTeg, abi);

        return codeSource;
    }

    addSingleParamToData(codeSource: string, newData: Param): string {

        const defenition = '/*PARAM_DEFENITION*/';
        const constructor = '/*PARAM_CONSTRUCTOR*/';
        const assignment = '/*PARAM_SET*/';
        const limit = '/*PARAM_LIMIT*/';
        const require = '/*PARAM_REQUIRE*/';
        const constant = '/*CONST*/';

        const paramType = newData.type;
        const paramName = newData.name;

        //need fix
        if (paramType == 'enum') { 
            const paramConstant = constant + '\n\t' + paramType + ' ' +  paramName;

            codeSource = codeSource.replace(constant, paramConstant);

            return codeSource;
        }

        const paramDefenition = defenition + '\n\t' + paramType + ' _' + paramName + ';';
        const paramConstructor =  ', ' + paramType + ' ' + paramName + constructor;
        const paramAssignment = assignment + '\n\t\t_' + paramName + ' = ' + paramName + ';';

        
        codeSource = codeSource.replace(defenition, paramDefenition);
        codeSource = codeSource.replace(constructor, paramConstructor);
        codeSource = codeSource.replace(assignment, paramAssignment);

        if (newData.minValue != undefined && newData.maxValue != undefined  && newData.isRequired != undefined) {
            const minValue = newData.minValue;
            const maxValue = newData.maxValue;
            const isRequired = newData.isRequired

            const paramsLimit = `valuesLimit['${paramName}'] = paramInfo(${minValue}, ${maxValue}, ${isRequired});` + limit;

            let condition: string = '';
            switch (paramType) {
            case "string":
              condition = `bytes(${paramName}).length >= ${minValue} && bytes(${paramName}).length <= ${maxValue}`;
              if (newData.isRequired) {
                condition = condition + ` && ${paramName} != ''`; 
            }
              break;
            case "int":
              condition = `${paramName} >= ${minValue} && ${paramName} <= ${maxValue}`;
              if (isRequired) {
                condition = condition + ` && ${paramName} != 0`; 
              }
              break;
            }
            const paramRequire = `require(${condition}, ERROR_LIMIT);` + require;

            codeSource = codeSource.replace(require, paramRequire);
            codeSource = codeSource.replace(limit, paramsLimit);
        }

        return codeSource
            
    }


    addSeveralParamsToData(codeSource: string, newDataArray: Array<Param>): string {
        let resultedContract = codeSource;

        newDataArray.forEach(newData => {
            resultedContract = addSingleParamToData(resultedContract, newData);
        });

        
        return resultedContract
    }

    addSingleParamToRoot(codeSource: string, newData: Param): string {
        
        const mintTeg = '/*PARAM_MINT_FUNCTION*/';
        const dataTeg = '/*PARAM_MINT*/';

        const paramType = newData.type;
        const paramName = newData.name;

        if (paramType == 'enum') { 
            return codeSource;
        }


        const paramsMint =  ', ' + paramType + ' ' + paramName + mintTeg;
        const paramsData =  ', ' + paramName + dataTeg;


        codeSource = codeSource.replace(mintTeg, paramsMint);
        codeSource = codeSource.replace(dataTeg, paramsData);

        return codeSource
            
    }


    addSeveralParamsToRoot(codeSource: string, newDataArray: Array<Param>): string {
        let resultedContract = codeSource;

        newDataArray.forEach(newData => {
            resultedContract = addSingleParamToRoot(resultedContract, newData);
        });

        return resultedContract
    }

}

export const { insertAbi } = new AddParamsToNftRootConstructor();
export const { addSingleParamToData } = new AddParamsToNftRootConstructor();
export const { addSeveralParamsToData } = new AddParamsToNftRootConstructor();
export const { addSingleParamToRoot} = new AddParamsToNftRootConstructor();
export const { addSeveralParamsToRoot } = new AddParamsToNftRootConstructor();
