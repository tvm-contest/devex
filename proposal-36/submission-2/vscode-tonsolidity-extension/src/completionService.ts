'use strict';
import { Parser } from './parser/tonsolidity';
import {ContractCollection} from './model/contractsCollection';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';
import { initialiseProject } from './projectService';
import * as vscode from 'vscode-languageserver';
import {Contract2, DeclarationType, DocumentContract, Function, SolidityCodeWalker, Variable, Struct} from './codeWalkerService';
import * as glob from 'glob';
import { relative } from 'path';
import { fileURLToPath } from 'url';
import * as path from 'path';


export class CompletionService {

    public rootPath: string;
    public solparser = new Parser();

    constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    public getTypeString(literal: any) {
        const isArray = literal.array_parts.length > 0;
        let isMapping = false;
        const literalType = literal.literal;
        let suffixType = '';

        if (typeof literalType.type !== 'undefined')  {
             isMapping = literalType.type === 'MappingExpression';
             if (isMapping) {
                suffixType = '(' + this.getTypeString(literalType.from) + ' => ' + this.getTypeString(literalType.to) + ')';
            }
        }

        if (isArray) {
            suffixType = suffixType + '[]';
        }

        if (isMapping) {
            return 'mapping' + suffixType;
        }

        return literalType + suffixType;
    }

    public createFunctionParamsSnippet(params: any, skipFirst: boolean = false): string {
        let paramsSnippet = '';
        let counter = 0;
        if (typeof params !== 'undefined' && params !== null) {
            params.forEach( parameterElement => {
               if(skipFirst && counter === 0) {
                  skipFirst = false; 
               } else {
                const typeString = this.getTypeString(parameterElement.literal);
                counter = counter + 1;
                const currentParamSnippet = '${' + counter + ':' + parameterElement.id + '}';
                    if (paramsSnippet === '') {
                        paramsSnippet = currentParamSnippet;
                    } else {
                        paramsSnippet = paramsSnippet + ', ' + currentParamSnippet;
                    }
                }
            });
        }
        return paramsSnippet;
    }

    public createParamsInfo(params: any): string {
        let paramsInfo = '';
        if (typeof params !== 'undefined' && params !== null) {
            if (params.hasOwnProperty('params')) {
                params = params.params;
            }
            params.forEach( parameterElement => {
               const typeString = this.getTypeString(parameterElement.literal);
                let currentParamInfo = '';
                if (typeof parameterElement.id !== 'undefined' && parameterElement.id !== null ) { // no name on return parameters
                    currentParamInfo = typeString + ' ' + parameterElement.id;
                } else {
                    currentParamInfo = typeString;
                }
                if (paramsInfo === '') {
                    paramsInfo = currentParamInfo;
                } else {
                    paramsInfo = paramsInfo + ', ' + currentParamInfo;
                }
            });
        }
        return paramsInfo;
    }

    public createFunctionEventCompletionItem(contractElement: any, type: string, contractName: string, skipFirstParamSnipppet: boolean = false): CompletionItem {

        const completionItem =  CompletionItem.create(contractElement.name);
        completionItem.kind = CompletionItemKind.Function;
        const paramsInfo = this.createParamsInfo(contractElement.params);
        const paramsSnippet = this.createFunctionParamsSnippet(contractElement.params, skipFirstParamSnipppet);
        let returnParamsInfo = this.createParamsInfo(contractElement.returnParams);
        if (returnParamsInfo !== '') {
            returnParamsInfo = ' returns (' + returnParamsInfo + ')';
        }
        completionItem.insertTextFormat = 2;
        completionItem.insertText = contractElement.name + '(' + paramsSnippet + ');';
        const info = '(' + type + ' in ' + contractName + ') ' + contractElement.name + '(' + paramsInfo + ')' + returnParamsInfo;
        completionItem.documentation = info;
        completionItem.detail = info;
        return completionItem;
    }

    public createParameterCompletionItem(contractElement: any, type: string, contractName: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractElement.id);
        completionItem.kind = CompletionItemKind.Variable;
        const typeString = this.getTypeString(contractElement.literal);
        completionItem.detail = '(' + type + ' in ' + contractName + ') '
                                            + typeString + ' ' + contractElement.id;
        return completionItem;
    }

    public createVariableCompletionItem(contractElement: any, type: string, contractName: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractElement.name);
        completionItem.kind = CompletionItemKind.Field;
        const typeString = this.getTypeString(contractElement.literal);
        completionItem.detail = '(' + type + ' in ' + contractName + ') '
                                            + typeString + ' ' + contractElement.name;
        return completionItem;
    }

    public createStructCompletionItem(contractElement: any, contractName: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractElement.name);
        completionItem.kind = CompletionItemKind.Struct;
        //completionItem.insertText = contractName + '.' + contractElement.name;
        completionItem.insertText = contractElement.name;
        completionItem.detail = '(Struct in ' + contractName + ') '
                                            + contractElement.name;
        return completionItem;
    }

    public createTvmBuilderCompletionItem(contractElement: any, contractName: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractElement.name);
        completionItem.kind = CompletionItemKind.Variable;
        //completionItem.insertText = contractName + '.' + contractElement.name;
        completionItem.insertText = contractElement.name;
        completionItem.detail = '(TvmBuilder in ' + contractName + ') '
                                            + contractElement.name;
        return completionItem;
    }

    public createEnumCompletionItem(contractElement: any, contractName: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractElement.name);
        completionItem.kind = CompletionItemKind.Enum;
        //completionItem.insertText = contractName + '.' + contractElement.name;
        completionItem.insertText = contractElement.name;
        completionItem.detail = '(Enum in ' + contractName + ') '
                                            + contractElement.name;
        return completionItem;
    }
    
    // type "Contract, Libray, Abstract contract"
    public createContractCompletionItem(contractName: string, type: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractName);
        completionItem.kind = CompletionItemKind.Class;
        completionItem.insertText = contractName;
        completionItem.detail = '(' + type + ' : ' + contractName + ') '
                        
        return completionItem;
    }

    public createInterfaceCompletionItem(contractName: string): CompletionItem {

        const completionItem =  CompletionItem.create(contractName);
        completionItem.kind = CompletionItemKind.Interface;
        completionItem.insertText = contractName;
        completionItem.detail = '( Interface : ' + contractName + ') '               
        return completionItem;
    }
  

    public getDocumentCompletionItems(documentText: string): CompletionItem[] {
        const completionItems = [];
        try {
            const result = this.solparser.parse(documentText);
            // console.log(JSON.stringify(result));
            // TODO struct, modifier
            result.body.forEach(element => {
                if (element.type === 'ContractStatement' ||  element.type === 'LibraryStatement' || element.type == 'InterfaceStatement') {
                    const contractName = element.name;
                    if (typeof element.body !== 'undefined' && element.body !== null) {
                        element.body.forEach(contractElement => {
                            if (contractElement.type === 'FunctionDeclaration') {
                                // ignore the constructor TODO add to contract initialiasation
                                if (contractElement.name !== contractName) {
                                    completionItems.push(
                                            this.createFunctionEventCompletionItem(contractElement, 'function', contractName ));
                                }
                            }

                            if (contractElement.type === 'EventDeclaration') {
                                completionItems.push(this.createFunctionEventCompletionItem(contractElement, 'event', contractName ));
                            }

                            if (contractElement.type === 'StateVariableDeclaration') {
                                completionItems.push(this.createVariableCompletionItem(contractElement, 'state variable', contractName));
                            }

                            if (contractElement.type === 'EnumDeclaration') {
                                completionItems.push(this.createEnumCompletionItem(contractElement, contractName));
                            }

                            if (contractElement.type === 'StructDeclaration') {
                                completionItems.push(this.createStructCompletionItem(contractElement, contractName));
                            }

                            if (contractElement.type === 'TvmBuilderDeclaration') {
                                completionItems.push(this.createTvmBuilderCompletionItem(contractElement, contractName));
                            }
                            
                        });
                    }
                }
            });
        } catch (error) {
          // gracefule catch
          // console.log(error.message);
        }
        console.log('file completion items' + completionItems.length);
        return completionItems;
    }


    public getAllCompletionItems2(packageDefaultDependenciesDirectory: string,
        packageDefaultDependenciesContractsDirectory: string,
        document: vscode.TextDocument,
        position: vscode.Position,
      ): CompletionItem[] {
        let completionItems = [];
        let triggeredByEmit = false;
        let triggeredByImport = false;
        let triggeredByDotStart = 0;
        try {
            var walker = new SolidityCodeWalker(this.rootPath,  packageDefaultDependenciesDirectory,
                packageDefaultDependenciesContractsDirectory,
            );
            const offset = document.offsetAt(position);

            var documentContractSelected = walker.getAllContracts(document, position);

            const lines = document.getText().split(/\r?\n/g);
            triggeredByDotStart = this.getTriggeredByDotStart(lines, position);
            
            //triggered by emit is only possible with ctrl space
            triggeredByEmit = getAutocompleteVariableNameTrimmingSpaces(lines[position.line], position.character - 1) === 'emit';
            triggeredByImport = getAutocompleteVariableNameTrimmingSpaces(lines[position.line], position.character - 1) === 'import';
            
            if (triggeredByDotStart > 0) {
                
                const globalVariableContext = GetContextualAutoCompleteByGlobalVariable(lines[position.line], triggeredByDotStart);
                if (globalVariableContext != null) {
                    completionItems = completionItems.concat(globalVariableContext);
                } else {
                    let autocompleteByDot = getAutocompleteTriggerByDotVariableName(lines[position.line], triggeredByDotStart - 1);
                    // if triggered by variable //done
                    // todo triggered by method (get return type) // done
                    // todo triggered by property // done
                    // todo variable // method return is an array (push, length etc)
                    // variable / method / property is an address or other specific type functionality (balance, etc)
                    // variable / method / property type is extended by a library
                    if (autocompleteByDot.name !== '') {
                        // have we got a selected contract (assuming not type.something)
                        if (documentContractSelected.selectedContract !== undefined && documentContractSelected.selectedContract !== null ) {
                            let selectedContract = documentContractSelected.selectedContract;

                            //this contract
                            if (autocompleteByDot.name === 'this' && autocompleteByDot.isVariable && autocompleteByDot.parentAutocomplete === null) {

                                //add selected contract completion items
                                this.addContractCompletionItems(selectedContract, completionItems);

                            } else  {
                                /// the types 
                                let topParent = autocompleteByDot.getTopParent();
                                if (topParent.name === "this") {
                                    topParent = topParent.childAutocomplete;
                                }
                                this.findDotCompletionItemsForSelectedContract(topParent, completionItems, documentContractSelected, documentContractSelected.selectedContract, offset);
                            }
                        }
                    }
                }
                return completionItems;
            }

            if (triggeredByImport) {
                let files = glob.sync(this.rootPath + '/**/*.tsol');
                files.forEach(item => {
                    let dependenciesDir = path.join(this.rootPath, packageDefaultDependenciesDirectory);
                    item = path.join(item);
                    if (item.startsWith(dependenciesDir)) {
                        let pathLibrary = item.substr(dependenciesDir.length + 1);
                        pathLibrary = pathLibrary.split('\\').join('/');
                        let completionItem = CompletionItem.create(pathLibrary);
                        completionItem.kind = CompletionItemKind.Reference;
                        completionItem.insertText = '"' + pathLibrary + '";';
                        completionItems.push(completionItem);
                    } else {
                        let rel = relative(fileURLToPath(document.uri), item);
                        rel = rel.split('\\').join('/');
                        if(rel.startsWith('../')) {
                            rel = rel.substr(1);
                        }
                        let completionItem = CompletionItem.create(rel);
                        completionItem.kind = CompletionItemKind.Reference;
                        completionItem.insertText = '"' + rel + '";';
                        completionItems.push(completionItem);
                    }
                });
                return completionItems;
            }

            if (triggeredByEmit) {
                if (documentContractSelected.selectedContract !== undefined && documentContractSelected.selectedContract !== null ) {
                    this.addAllEventsAsCompletionItems(documentContractSelected.selectedContract, completionItems);
                }
            } else {
                if(documentContractSelected.selectedContract !== undefined && documentContractSelected.selectedContract !== null ) {
                    let selectedContract = documentContractSelected.selectedContract;
                    this.addSelectedContractCompletionItems(selectedContract, completionItems, offset);
                }

                documentContractSelected.allContracts.forEach(x => {
                    if(x.contractType === "ContractStatement") {
                        completionItems.push(this.createContractCompletionItem(x.name, "Contract"));
                    }
                
                    if(x.contractType === "LibraryStatement") {
                        completionItems.push(this.createContractCompletionItem(x.name, "Library"));
                    }

                    if(x.contractType === "InterfaceStatement") {
                        completionItems.push(this.createInterfaceCompletionItem(x.name));
                    }
                })
            }

        } catch (error) {
            // graceful catch
            console.log(error);
        } finally {
            completionItems = completionItems.concat(GetCompletionTypes());
            completionItems = completionItems.concat(GetCompletionKeywords());
            completionItems = completionItems.concat(GeCompletionUnits());
            completionItems = completionItems.concat(GetGlobalFunctions());
            completionItems = completionItems.concat(GetGlobalVariables());
        }
        return completionItems;
    }

    private findDotCompletionItemsForSelectedContract(autocompleteByDot:AutocompleteByDot, completionItems: any[], documentContractSelected: DocumentContract, currentContract: Contract2, offset:number) {
        if (currentContract === documentContractSelected.selectedContract) {
            let selectedFunction = documentContractSelected.selectedContract.getSelectedFunction(offset);
            this.findDotCompletionItemsForContract(autocompleteByDot, completionItems, documentContractSelected.allContracts, documentContractSelected.selectedContract, selectedFunction, offset);
        } else {
            this.findDotCompletionItemsForContract(autocompleteByDot, completionItems, documentContractSelected.allContracts, documentContractSelected.selectedContract);
        }
    }

    private findDotCompletionItemsForContract(autocompleteByDot:AutocompleteByDot, completionItems: any[], allContracts: Contract2[], currentContract: Contract2, selectedFunction: Function = null, offset:number = null) {        
        let allStructs = currentContract.getAllStructs();
        let allEnums = currentContract.getAllEnums();
        let allVariables: Variable[] = currentContract.getAllStateVariables();
        let allfunctions: Function[] = currentContract.getAllFunctions();

        if (selectedFunction !== undefined && selectedFunction !== null)  {
            selectedFunction.findVariableDeclarationsInScope(offset, null);
            //adding input parameters
            allVariables = allVariables.concat(selectedFunction.input);
            //ading all variables
            allVariables = allVariables.concat(selectedFunction.variablesInScope);
        }
        
        let found = false;
        if (autocompleteByDot.isVariable) {
            allVariables.forEach(item => {
                if (item.name === autocompleteByDot.name && !found) {
                    found = true;
                    if(autocompleteByDot.childAutocomplete !== undefined && autocompleteByDot.childAutocomplete !== null) {
                        this.findDotType(allStructs, item.type, autocompleteByDot.childAutocomplete, completionItems, allContracts, currentContract);
                    } else {
                        this.findDotTypeCompletion(allStructs, item.type, completionItems, allContracts, currentContract);
                    }
                }
            });

            if (!found &&  (autocompleteByDot.childAutocomplete === undefined || autocompleteByDot.childAutocomplete === null)) {
                allEnums.forEach(item => {
                    if (item.name === autocompleteByDot.name) {
                        found = true;
                        item.items.forEach(property => {
                            let completitionItem = CompletionItem.create(property);
                            completionItems.push(completitionItem);
                        });
                    }
                });
            }

            if (!found && (autocompleteByDot.childAutocomplete === undefined || autocompleteByDot.childAutocomplete === null) ) {
                allContracts.forEach(item => {
                    if (item.name === autocompleteByDot.name) {
                        found = true;
                        this.addContractCompletionItems(item, completionItems);
                    }
                });
            }
        }

        if (autocompleteByDot.isMethod) {

            allfunctions.forEach(item => {
                if (item.name === autocompleteByDot.name) {
                    found = true;
                    if (item.output.length === 1) {
                        //todo return array
                        let type = item.output[0].type;

                        if(autocompleteByDot.childAutocomplete !== undefined && autocompleteByDot.childAutocomplete !== null) {
                            this.findDotType(allStructs, type, autocompleteByDot.childAutocomplete, completionItems, allContracts, currentContract);
                        } else {
                            this.findDotTypeCompletion(allStructs, type, completionItems, allContracts, currentContract);
                        }
                    }
                }
            });

            //contract declaration as IMyContract(address)
            if (!found && (autocompleteByDot.childAutocomplete === undefined || autocompleteByDot.childAutocomplete === null) ) {
                allContracts.forEach(item => {
                    if (item.name === autocompleteByDot.name) {
                        found = true;
                        this.addContractCompletionItems(item, completionItems);
                    }
                });
            }
        }
    }

    private findDotTypeCompletion(allStructs: Struct[], type: DeclarationType, completionItems: any[], allContracts: Contract2[], currentContract: Contract2) {
        //console.log("type " + type.name);
        let foundStruct = allStructs.find(x => x.name === type.name);
        if (foundStruct !== undefined) {
            foundStruct.variables.forEach(property => {
                //own method refactor
                let completitionItem = CompletionItem.create(property.name);
                const typeString = this.getTypeString(property.element.literal);
                completitionItem.detail = '(' + property.name + ' in ' + foundStruct.name + ') '
                    + typeString + ' ' + foundStruct.name;
                completionItems.push(completitionItem);
            });
        } else {

            let foundContract = allContracts.find(x => x.name === type.name);
            if (foundContract !== undefined) {
                foundContract.initialiseExtendContracts(allContracts);
                this.addContractCompletionItems(foundContract, completionItems);
            }
        }

        let allUsing = currentContract.getAllUsing(type);
        allUsing.forEach(usingItem => {
            let foundLibrary = allContracts.find(x => x.name === usingItem.name);
            if (foundLibrary !== undefined) {
                this.addAllLibraryExtensionsAsCompletionItems(foundLibrary, completionItems, type);
            }
        });

        if (type.name == 'DataStruct') {
            const items = getStructCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'bytes') {
            const items = getBytesCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }
        
        if (type.name == 'mapping') {
            const items = getMappingCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'address') {
            const items = getAddressMembersCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'string') {
            const items = getStringCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.isArray) {
            const items = getArrayCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'optional') {
            const items = getOptionalCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'vector') {
            const items = getVectorCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'TvmBuilder') {
            const items = getTvmBuilderCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'TvmCell') {
            const items = getTvmCellCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }

        if (type.name == 'TvmSlice') {
            const items = getTvmSliceCompletionItems();
            for (let i in items) {
                completionItems.push(items[i]);
            }
        }
    }

    private findDotType(allStructs: Struct[], type: DeclarationType, autocompleteByDot: AutocompleteByDot, completionItems: any[], allContracts: Contract2[], currentContract: Contract2) {
        let foundStruct = allStructs.find(x => x.name === type.name);
        if (foundStruct !== undefined) {
            foundStruct.variables.forEach(property => {
                //own method refactor
                if(autocompleteByDot.name === property.name) {
                    if(autocompleteByDot.childAutocomplete !== undefined && autocompleteByDot.childAutocomplete !== null)  {
                        this.findDotType(allStructs, property.type, autocompleteByDot.childAutocomplete, completionItems, allContracts, currentContract);
                    } else {
                        this.findDotTypeCompletion(allStructs, property.type, completionItems, allContracts, currentContract);
                    }
                }
            });
        } else {

            let foundContract = allContracts.find(x => x.name === type.name);
            if (foundContract !== undefined) {
                foundContract.initialiseExtendContracts(allContracts);
                this.findDotCompletionItemsForContract(autocompleteByDot, completionItems, allContracts, foundContract);
                
            }
        }


        /*
        let allUsing = currentContract.getAllUsing(type);
        allUsing.forEach(usingItem => {
            let foundLibrary = allContracts.find(x => x.name === usingItem.name);
            if (foundLibrary !== undefined) {
                this.addAllLibraryExtensionsAsCompletionItems(foundLibrary, completionItems, type);
            }
        });
        */
    }


    private addContractCompletionItems(selectedContract: Contract2, completionItems: any[]) {
        this.addAllFunctionsAsCompletionItems(selectedContract, completionItems);

        this.addAllStateVariablesAsCompletionItems(selectedContract, completionItems);
    }

    private addSelectedContractCompletionItems(selectedContract: Contract2, completionItems: any[], offset: number) {
        this.addAllFunctionsAsCompletionItems(selectedContract, completionItems);

        this.addAllEventsAsCompletionItems(selectedContract, completionItems);

        this.addAllStateVariablesAsCompletionItems(selectedContract, completionItems);

        this.addAllStructsAsCompletionItems(selectedContract, completionItems);

        this.addAllEnumsAsCompletionItems(selectedContract, completionItems);

        let selectedFunction = selectedContract.getSelectedFunction(offset);

        if (selectedFunction !== undefined) {
            selectedFunction.findVariableDeclarationsInScope(offset, null);
            selectedFunction.input.forEach(parameter => {
                completionItems.push(this.createParameterCompletionItem(parameter.element, "function parameter", selectedFunction.contract.name));
            });
            selectedFunction.output.forEach(parameter => {
                completionItems.push(this.createParameterCompletionItem(parameter.element, "return parameter", selectedFunction.contract.name));
            });

            selectedFunction.variablesInScope.forEach(variable => {
                completionItems.push(this.createVariableCompletionItem(variable.element, "function variable", selectedFunction.contract.name));
            });
        }
    }

    private addAllEnumsAsCompletionItems(documentContractSelected: Contract2, completionItems: any[]) {
        let allEnums = documentContractSelected.getAllEnums();
        allEnums.forEach(item => {
            completionItems.push(
                this.createEnumCompletionItem(item.element, item.contract.name));
        });
    }

    private addAllStructsAsCompletionItems(documentContractSelected: Contract2, completionItems: any[]) {
        let allStructs = documentContractSelected.getAllStructs();
        allStructs.forEach(item => {
            completionItems.push(
                this.createStructCompletionItem(item.element, item.contract.name));
        });
    }

    private addAllEventsAsCompletionItems(documentContractSelected: Contract2, completionItems: any[]) {
        let allevents = documentContractSelected.getAllEvents();
        allevents.forEach(item => {
            completionItems.push(
                this.createFunctionEventCompletionItem(item.element, 'event', item.contract.name));
        });
    }

    private addAllStateVariablesAsCompletionItems(documentContractSelected: Contract2, completionItems: any[]) {
        let allStateVariables = documentContractSelected.getAllStateVariables();
        allStateVariables.forEach(item => {
            completionItems.push(
                this.createVariableCompletionItem(item.element, 'state variable', item.contract.name));
        });
    }

    private addAllFunctionsAsCompletionItems(documentContractSelected: Contract2, completionItems: any[]) {
        let allfunctions = documentContractSelected.getAllFunctions();
        allfunctions.forEach(item => {
            completionItems.push(
                this.createFunctionEventCompletionItem(item.element, 'function', item.contract.name));
        });
    }

    private addAllLibraryExtensionsAsCompletionItems(documentContractSelected: Contract2, completionItems: any[], type: DeclarationType) {
        let allfunctions = documentContractSelected.getAllFunctions();
        let filteredFunctions = allfunctions.filter( x => {
            if(x.input.length > 0 ) {
                let typex = x.input[0].type;
                let validTypeName = false;
                if(typex.name === type.name || (type.name === "address_payable" && typex.name === "address")) {
                    validTypeName = true;
                }
                 return typex.isArray === type.isArray && validTypeName && typex.isMapping === type.isMapping;
            }
            return false;
        });

        filteredFunctions.forEach(item => {
            completionItems.push(
                this.createFunctionEventCompletionItem(item.element, 'function', item.contract.name, true));
        });
    }

    public getTriggeredByDotStart(lines:string[], position: vscode.Position):number {
        let start = 0;
        let triggeredByDot = false;
        for (let i = position.character; i >= 0; i--) {
            if (lines[position.line[i]] === ' ') {
                triggeredByDot = false;
                i = 0;
                start = 0;
            }
            if (lines[position.line][i] === '.') {
                start = i;
                i = 0;
                triggeredByDot = true;
            }
        }
        return start;
    }

    public getAllCompletionItems(documentText: string,
                                documentPath: string,
                                packageDefaultDependenciesDirectory: string,
                                packageDefaultDependenciesContractsDirectory: string): CompletionItem[] {

        if (this.rootPath !== 'undefined' && this.rootPath !== null) {
            const contracts = new ContractCollection();
            contracts.addContractAndResolveImports(
                documentPath,
                documentText,
                initialiseProject(this.rootPath, packageDefaultDependenciesDirectory, packageDefaultDependenciesContractsDirectory));
            let completionItems = [];
            contracts.contracts.forEach(contract => {
                completionItems = completionItems.concat(this.getDocumentCompletionItems(contract.code));
            });
            // console.log('total completion items' + completionItems.length);
            return completionItems;
        } else {
            return this.getDocumentCompletionItems(documentText);
        }
    }
}

export function GetCompletionTypes(): CompletionItem[] {
    const completionItems = [];
    const types = ['address', 'string', 'bytes', 'byte', 'int', 'uint', 'bool', 'hash'];
    for (let index = 8; index <= 256; index += 8) {
        types.push('int' + index);
        types.push('uint' + index);
        types.push('bytes' + index / 8);
    }
    types.forEach(type => {
        const completionItem =  CompletionItem.create(type);
        completionItem.kind = CompletionItemKind.Keyword;
        completionItem.detail = type + ' type';
        completionItems.push(completionItem);
    });
    // add mapping
    return completionItems;
}

function CreateCompletionItem(label: string, kind: CompletionItemKind, detail: string) {
    const completionItem = CompletionItem.create(label);
    completionItem.kind = kind;
    completionItem.detail = detail;
    return completionItem;
}

export function GetCompletionKeywords(): CompletionItem[] {
    const completionItems = [];
    const keywords = [ 'modifier', 'mapping', 'break', 'continue', 'delete', 'else', 'for',
    'if', 'new', 'return', 'returns', 'while', 'using',
    'private', 'public', 'external', 'internal', 'payable', 'nonpayable', 'view', 'pure', 'case', 'do', 'else', 'finally',
    'in', 'instanceof', 'return', 'throw', 'try', 'catch', 'typeof', 'yield', 'void', 'virtual', 'override'] ;
    keywords.forEach(unit => {
        const completionItem =  CompletionItem.create(unit);
        completionItem.kind = CompletionItemKind.Keyword;
        completionItems.push(completionItem);
    });

    completionItems.push(CreateCompletionItem('contract', CompletionItemKind.Class, null));
    completionItems.push(CreateCompletionItem('library', CompletionItemKind.Class, null));
    completionItems.push(CreateCompletionItem('storage', CompletionItemKind.Field, null));
    completionItems.push(CreateCompletionItem('memory', CompletionItemKind.Field, null));
    completionItems.push(CreateCompletionItem('var', CompletionItemKind.Field, null));
    completionItems.push(CreateCompletionItem('constant', CompletionItemKind.Constant, null));
    completionItems.push(CreateCompletionItem('immutable', CompletionItemKind.Keyword, null));
    completionItems.push(CreateCompletionItem('constructor', CompletionItemKind.Constructor, null));
    completionItems.push(CreateCompletionItem('event', CompletionItemKind.Event, null));
    completionItems.push(CreateCompletionItem('import', CompletionItemKind.Module, null));
    completionItems.push(CreateCompletionItem('enum', CompletionItemKind.Enum, null));
    completionItems.push(CreateCompletionItem('struct', CompletionItemKind.Struct, null));
    completionItems.push(CreateCompletionItem('function', CompletionItemKind.Function, null));

    return completionItems;
}


export function GeCompletionUnits(): CompletionItem[] {
    const completionItems = [];
    const etherUnits = ['nano', 'nanoton', 'nTon', 'ton', 'Ton', 'micro', 
                        'microton', 'milli', 'milliton', 'kiloton', 'kTon', 
                        'megaton', 'MTon', 'gigaton', 'GTon'];
    etherUnits.forEach(unit => {
        const completionItem =  CompletionItem.create(unit);
        completionItem.kind = CompletionItemKind.Unit;
        completionItem.detail = unit + ': ether unit';
        completionItems.push(completionItem);
    });

    const timeUnits = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'years'];
    timeUnits.forEach(unit => {
        const completionItem =  CompletionItem.create(unit);
        completionItem.kind = CompletionItemKind.Unit;

        if (unit !== 'years') {
            completionItem.detail = unit + ': time unit';
        } else {
            completionItem.detail = 'DEPRECATED: ' + unit + ': time unit';
        }
        completionItems.push(completionItem);
    });

    return completionItems;
}

export function GetGlobalVariables(): CompletionItem[] {
    return [
        {
            detail: 'Current block',
            kind: CompletionItemKind.Variable,
            label: 'block',
        },
        {
            detail: 'Current Message',
            kind: CompletionItemKind.Variable,
            label: 'msg',
        },
        {
            detail: 'TON virtual machine',
            kind: CompletionItemKind.Variable,
            label: 'tvm',
        },
        {
            detail: '(uint): current block timestamp (alias for block.timestamp)',
            kind: CompletionItemKind.Variable,
            label: 'now',
        },
        {
            detail: 'Current transaction',
            kind: CompletionItemKind.Variable,
            label: 'tx',
        },
        {
            detail: 'ABI encoding / decoding',
            kind: CompletionItemKind.Variable,
            label: 'abi',
        },
    ];
}

export function GetGlobalFunctions(): CompletionItem[] {
    return [
        {
            detail: 'assert(bool condition): throws if the condition is not met - to be used for internal errors.',
            insertText: 'assert(${1:condition});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Function,
            label: 'assert',
        },
        {
            detail: 'gasleft(): returns the remaining gas',
            insertText: 'gasleft();',
            insertTextFormat: 2,
            kind: CompletionItemKind.Function,
            label: 'gasleft',
        },
        {
            detail: 'unicode: converts string into unicode',
            insertText: 'unicode"${1:text}"',
            insertTextFormat: 2,
            kind: CompletionItemKind.Function,
            label: 'unicode',
        },
        {
            detail: 'blockhash(uint blockNumber): hash of the given block - only works for 256 most recent, excluding current, blocks',
            insertText: 'blockhash(${1:blockNumber});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Function,
            label: 'blockhash',
        },
        {
            detail: 'require(bool condition): reverts if the condition is not met - to be used for errors in inputs or external components.',
            insertText: 'require(${1:condition});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'require',
        },
        {
            // tslint:disable-next-line:max-line-length
            detail: 'require(bool condition, string message): reverts if the condition is not met - to be used for errors in inputs or external components. Also provides an error message.',
            insertText: 'require(${1:condition}, ${2:message});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'require',
        },
        {
            detail: 'revert(): abort execution and revert state changes',
            insertText: 'revert();',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'revert',
        },
        {
            detail: 'addmod(uint x, uint y, uint k) returns (uint):' +
                    'compute (x + y) % k where the addition is performed with arbitrary precision and does not wrap around at 2**256',
            insertText: 'addmod(${1:x}, ${2:y}, ${3:k})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'addmod',
        },
        {
            detail: 'mulmod(uint x, uint y, uint k) returns (uint):' +
                    'compute (x * y) % k where the multiplication is performed with arbitrary precision and does not wrap around at 2**256',
            insertText: 'mulmod(${1:x}, ${2:y}, ${3:k})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'mulmod',
        },
        {
            detail: 'keccak256(...) returns (bytes32):' +
                    'compute the Ethereum-SHA-3 (Keccak-256) hash of the (tightly packed) arguments',
            insertText: 'keccak256(${1:x})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'keccak256',
        },
        {
            detail: 'sha256(...) returns (bytes32):' +
                    'compute the SHA-256 hash of the (tightly packed) arguments',
            insertText: 'sha256(${1:x})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'sha256',
        },
        {
            detail: 'sha3(...) returns (bytes32):' +
                    'alias to keccak256',
            insertText: 'sha3(${1:x})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'sha3',
        },
        {
            detail: 'ripemd160(...) returns (bytes20):' +
                    'compute RIPEMD-160 hash of the (tightly packed) arguments',
            insertText: 'ripemd160(${1:x})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'ripemd160',
        },
        {
            detail: 'ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) returns (address):' +
                    'recover the address associated with the public key from elliptic curve signature or return zero on error',
            insertText: 'ecrecover(${1:hash}, ${2:v}, ${3:r}, ${4:s})',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'ecrecover',
        },

    ];
}

export function GetContextualAutoCompleteByGlobalVariable(lineText: string, wordEndPosition: number): CompletionItem[] {
    if (isAutocompleteTrigeredByVariableName('block', lineText, wordEndPosition)) {
        return getBlockCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('math', lineText, wordEndPosition)) {
        return getMathCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('address', lineText, wordEndPosition)) {
        return getAddressCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('msg', lineText, wordEndPosition)) {
        return getMsgCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('tvm', lineText, wordEndPosition)) {
        return getTvmCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('tx', lineText, wordEndPosition)) {
        return getTxCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('abi', lineText, wordEndPosition)) {
        return getAbiCompletionItems();
    }
    if (isAutocompleteTrigeredByVariableName('rnd', lineText, wordEndPosition)) {
        return getRndCompletionItems();
    }
    return null;
}

function isAutocompleteTrigeredByVariableName(variableName: string, lineText: string, wordEndPosition: number): Boolean {
    const nameLength = variableName.length;
    if (wordEndPosition >= nameLength
        // does it equal our name?
        && lineText.substr(wordEndPosition - nameLength, nameLength) === variableName) {
          return true;
        }
    return false;
}

export class AutocompleteByDot {
    public isVariable: boolean = false;
    public isMethod: boolean = false;
    public isArray: boolean = false;
    public isProperty: boolean = false;
    public parentAutocomplete: AutocompleteByDot = null;// could be a property or a method
    public childAutocomplete: AutocompleteByDot = null;
    public name: string = '';

    getTopParent(): AutocompleteByDot {
        if(this.parentAutocomplete != null) {
            return this.parentAutocomplete.getTopParent();
        }
        return this;
    }
}


function getAutocompleteTriggerByDotVariableName(lineText: string, wordEndPosition:number): AutocompleteByDot {
    let searching = true;
    let result: AutocompleteByDot = new AutocompleteByDot();
    //simpler way might be to find the first space or beginning of line
    //and from there split / match (but for now kiss or slowly)
    wordEndPosition = getArrayStart(lineText, wordEndPosition, result);

    if (lineText[wordEndPosition] == ')' ) {
        result.isMethod = true;
        let methodParamBeginFound = false;
        while (!methodParamBeginFound && wordEndPosition >= 0 ) {
            if (lineText[wordEndPosition] === '(') {
                methodParamBeginFound = true;
            }
            wordEndPosition = wordEndPosition - 1;
        }
    }

    if (!result.isMethod && !result.isArray) {
        result.isVariable = true;
    }

    while(searching && wordEndPosition >= 0) {
        let currentChar = lineText[wordEndPosition];
        if (isAlphaNumeric(currentChar) || currentChar === '_' || currentChar === '$') {
            result.name = currentChar + result.name;
            wordEndPosition = wordEndPosition - 1;
        } else {
            if (currentChar === ' ') { // we only want a full word for a variable / method // this cannot be parsed due incomplete statements
                searching = false;
                return result;
            } else {
                if(currentChar === '.') {
                    result.parentAutocomplete = getAutocompleteTriggerByDotVariableName(lineText, wordEndPosition - 1);
                    result.parentAutocomplete.childAutocomplete = result;
                }
            }
            searching = false;
            return result;
        }
    }
    return result;
}

function getArrayStart(lineText: string, wordEndPosition: number, result: AutocompleteByDot) {
    if (lineText[wordEndPosition] == ']') {
        result.isArray = true;
        let arrayBeginFound = false;
        while (!arrayBeginFound && wordEndPosition >= 0) {
            if (lineText[wordEndPosition] === '[') {
                arrayBeginFound = true;
            }
            wordEndPosition = wordEndPosition - 1;
        }
    }
    if(lineText[wordEndPosition] == ']') {
        wordEndPosition = getArrayStart(lineText, wordEndPosition, result);
    }
    return wordEndPosition;
}

function getAutocompleteVariableNameTrimmingSpaces(lineText: string, wordEndPosition:number): string {
    let searching = true;
    let result: string = '';
    if (lineText[wordEndPosition] === ' ' ) {
        let spaceFound = true;
        while(spaceFound && wordEndPosition >= 0 ) {
            wordEndPosition = wordEndPosition - 1;
            if(lineText[wordEndPosition] !== ' ') {
                spaceFound = false;
            }
        }
    }

    while (searching && wordEndPosition >= 0) {
        let currentChar = lineText[wordEndPosition];
        if (isAlphaNumeric(currentChar) || currentChar === '_' || currentChar === '$') {
            result = currentChar + result;
            wordEndPosition = wordEndPosition - 1;
        } else {
            if(currentChar === ' ') { // we only want a full word for a variable // this cannot be parsed due incomplete statements
                searching = false;
                return result;
            }
            searching = false;
            return '';
        }
    }
    return result;
}

function isAlphaNumeric(str) {
    var code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
};

function getMathCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Returns the minimal value of the passed arguments. T should be an integer or fixed point type',
            kind: CompletionItemKind.Property,
            label: 'min',
        },
        {
            detail: 'Returns the maximal value of the passed arguments. T should be an integer or fixed point type',
            kind: CompletionItemKind.Property,
            label: 'max',
        },
        {
            detail: 'Returns minimal and maximal values of the passed arguments. T should be an integer or fixed point type',
            kind: CompletionItemKind.Property,
            label: 'minmax',
        },
        {
            detail: 'Computes the absolute value of the given integer.',
            kind: CompletionItemKind.Property,
            label: 'abs',
        },
        {
            detail: 'Computes the value modulo 2^power. Note that power should be a constant integer.',
            kind: CompletionItemKind.Property,
            label: 'modpow2',
        },
        {
            detail: `Returns result of the division of two integers. T should be an integer or fixed point type.
            The return value is rounded. nearest mode is used.`,
            kind: CompletionItemKind.Property,
            label: 'divr',
        },
        {
            detail: `Returns result of the division of two integers. T should be an integer or fixed point type.
            The return value is rounded. ceiling mode is used.`,
            kind: CompletionItemKind.Property,
            label: 'divc',
        },
        {
            detail: `Multiplies two values and then divides the result by a third value. T is integer type.
            The return value is rounded. floor mode is used.`,
            kind: CompletionItemKind.Property,
            label: 'muldiv',
        },
        {
            detail: `Multiplies two values and then divides the result by a third value. T is integer type.
            The return value is rounded. nearest mode is used.`,
            kind: CompletionItemKind.Property,
            label: 'muldivr',
        },
        {
            detail: `Multiplies two values and then divides the result by a third value. T is integer type.
            The return value is rounded. ceiling mode is used.`,
            kind: CompletionItemKind.Property,
            label: 'muldivc',
        },
        {
            detail: `This instruction multiplies first two arguments, divides the result by third argument and returns the result and the remainder. Intermediate result is stored in the 514 bit buffer, and the final result is rounded to the floor.`,
            kind: CompletionItemKind.Property,
            label: 'muldivmod',
        },
        {
            detail: `This instruction divides the first number by the second one and returns the result and the
            remainder. Result is rounded to the floor. T is integer type.`,
            kind: CompletionItemKind.Property,
            label: 'divmod',
        },
        {
            detail: `Returns number in case of sign of the argument value val:

            * -1 if val is negative;
            * 0 if val is zero;
            * 1 if val is positive.`,
            kind: CompletionItemKind.Property,
            label: 'sign',
        },
    ]
}

function getBlockCompletionItems(): CompletionItem[] {
    return [
        {
            detail: '(address): Current block miner’s address',
            kind: CompletionItemKind.Property,
            label: 'coinbase',
        },
        {
            detail: '(bytes32): DEPRICATED In 0.4.22 use blockhash(uint) instead. Hash of the given block - only works for 256 most recent blocks excluding current',
            insertText: 'blockhash(${1:blockNumber});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'blockhash',
        },
        {
            detail: '(uint): current block difficulty',
            kind: CompletionItemKind.Property,
            label: 'difficulty',
        },
        {
            detail: '(uint): current block gaslimit',
            kind: CompletionItemKind.Property,
            label: 'gaslimit',
        },
        {
            detail: '(uint): current block number',
            kind: CompletionItemKind.Property,
            label: 'number',
        },
        {
            detail: '(uint64): Returns the starting logical time of the current block.',
            kind: CompletionItemKind.Property,
            label: 'timestamp',
        },
    ];
}

function getTxCompletionItems(): CompletionItem[] {
    return [
        {
            detail: '(uint): gas price of the transaction',
            kind: CompletionItemKind.Property,
            label: 'gas',
        },
        {
            detail: '(address): sender of the transaction (full call chain)',
            kind: CompletionItemKind.Property,
            label: 'origin',
        },
        {
            detail: '(uint64): Returns the logical time of the current transaction.',
            kind: CompletionItemKind.Property,
            label: 'timestamp',
        },
    ];
}

function getMsgCompletionItems(): CompletionItem[] {
    return [
        {
            detail: `Returns:

            sender of the message for internal message.
            address(0) for external message.
            address(0) for tick/tock transaction.`,
            kind: CompletionItemKind.Property,
            label: 'sender',
        },
        {
            detail: `Returns:

            Balance of the inbound message in nanotons for internal message.
            0 for external message.
            Undefined value for tick/tock transaction.`,
            kind: CompletionItemKind.Property,
            label: 'value',
        },
        {
            detail: 'Collections of arbitrary currencies contained in the balance of the inbound message.',
            kind: CompletionItemKind.Property,
            label: 'currencies',
        },
        {
            detail: `Returns sender's public key, obtained from the body of the external inbound message. If the message is not signed, msg.pubkey() returns 0. If the message is signed and message header (pragma AbiHeader) does not contain pubkey then msg.pubkey() is equal to tvm.pubkey().`,
            kind: CompletionItemKind.Property,
            label: 'pubkey',
        },   
        {
            detail: 'Returns whether the contract is called by internal message transaction.',
            kind: CompletionItemKind.Property,
            label: 'isInternal',
        },
        {
            detail: 'Returns whether the contract is called by external message transaction.',
            kind: CompletionItemKind.Property,
            label: 'isExternal',
        },
        {
            detail: 'Returns whether the contract is called by tick/tock transaction.',
            kind: CompletionItemKind.Property,
            label: 'isTickTock',
        },
        {
            detail: 'Returns a field created_at of the external inbound message.',
            kind: CompletionItemKind.Property,
            label: 'createdAt',
        },
        {
            detail: 'Returns a payload of the inbound message.',
            kind: CompletionItemKind.Property,
            label: 'data',
        },
    ];
}

function getAddressCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Constructs an address of type addr_std with given workchain id wid and value address_value.',
            kind: CompletionItemKind.Property,
            label: 'makeAddrStd',
        },
        {
            detail: 'Constructs an address of type addr_none.',
            kind: CompletionItemKind.Property,
            label: 'makeAddrNone',
        },
        {
            detail: 'Constructs an address of type addr_extern with given value with bitCnt bit length.',
            kind: CompletionItemKind.Property,
            label: 'makeAddrExtern',
        },
    ]
}

function getOptionalCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Checks whether opt contains a value.',
            kind: CompletionItemKind.Property,
            label: 'hasValue',
        },
        {
            detail: 'Returns the contained value, if the optional contains one. Otherwise, throws an exception.',
            kind: CompletionItemKind.Property,
            label: 'get',
        },
        {
            detail: 'Replaces the content of the optional with the contents of other.',
            kind: CompletionItemKind.Property,
            label: 'set',
        },
        {
            detail: 'Deletes the content of the optional.',
            kind: CompletionItemKind.Property,
            label: 'reset',
        },
    ]
}

function getStructCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Unpacks all members stored in the struct.',
            kind: CompletionItemKind.Property,
            label: 'unpack',
        },
    ]
}

function getArrayCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Add a new element to the array',
            kind: CompletionItemKind.Property,
            label: 'push',
        },
        {
            detail: 'Returns status flag whether the array is empty (its length is 0).',
            kind: CompletionItemKind.Property,
            label: 'empty',
        },
    ]
}

function getStringCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Returns status flag whether the string is empty (its length is 0).',
            kind: CompletionItemKind.Property,
            label: 'empty',
        },
        {
            detail: 'Returns byte length of the string data.',
            kind: CompletionItemKind.Property,
            label: 'byteLength',
        },
        {
            detail: `Returns a substring starting from the byte with number from with byte length count.
            Note: if count is not set, then the new string will be cut from the from byte to the end of the string.`,
            kind: CompletionItemKind.Property,
            label: 'substr',
        },
        {
            detail: 'Appends the tail string to the string.',
            kind: CompletionItemKind.Property,
            label: 'append',
        },
        {
            detail: 'Looks for symbol (or substring) in the string and returns index of the first occurrence. If there is no such symbol in the string, empty optional is returned.',
            kind: CompletionItemKind.Property,
            label: 'find',
        },
        {
            detail: 'Looks for symbol (or substring) in the string and returns index of the last occurrence. If there is no such symbol in the string, empty optional is returned.',
            kind: CompletionItemKind.Property,
            label: 'findLast',
        },
    ]
}

function getAddressMembersCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Returns the workchain id of addr_std or addr_var. Throws "range check error" exception (error code equal to 5) for another address types.',
            kind: CompletionItemKind.Property,
            label: 'wid',
        },
        {
            detail: 'Returns the address value of addr_std or addr_var if addr_var has 256-bit address value. Throws "range check error" exception (error code equal to 5) for another address types.',
            kind: CompletionItemKind.Property,
            label: 'value',
        },
        {
            detail: `Returns the balance of this contract in nanotons.`,
            kind: CompletionItemKind.Property,
            label: 'balance',
        },
        {
            detail: 'Returns currencies on the balance of this contract.',
            kind: CompletionItemKind.Property,
            label: 'currencies',
        },
        {
            detail: `Returns type of the address:
            0 - addr_none 1 - addr_extern 2 - addr_std`,
            kind: CompletionItemKind.Property,
            label: 'getType',
        },
        {
            detail: 'Returns the result of comparison between this address with zero address of type addr_std.',
            kind: CompletionItemKind.Property,
            label: 'isStdZero',
        },
        {
            detail: 'Check whether this address is of type addr_std without any cast.',
            kind: CompletionItemKind.Property,
            label: 'isStdAddrWithoutAnyCast',
        },
        {
            detail: 'Returns the result of comparison between this address with zero address of type addr_extern.',
            kind: CompletionItemKind.Property,
            label: 'isExternZero',
        },
        {
            detail: 'Check whether this address is of type addr_none.',
            kind: CompletionItemKind.Property,
            label: 'isNone',
        },
        {
            detail: `Parses <address> containing a valid MsgAddressInt (addr_std or addr_var), applies rewriting from the anycast (if present) to the same-length prefix of the address, and returns both the workchain wid and the 256-bit address value. If the address value is not 256-bit, or if <address> is not a valid serialization of MsgAddressInt, throws a cell deserialization exception.
            It's wrapper for opcode REWRITESTDADDR.`,
            kind: CompletionItemKind.Property,
            label: 'unpack',
        },
        {
            detail: `Sends an internal outbound message to defined address. Function parameters:

            * value (uint128) - amount of nanotons sent to the address.
            * currencies (ExtraCurrencyCollection) - additional currencies sent to the address. Defaults to an empty set.
            * bounce (bool) - if it's set and transaction (generated by the internal outbound message) falls (only at computing phase, not at action phase!) then funds will be returned. Otherwise (flag isn't set or transaction terminated successfully) the address accepts the funds even if the account doesn't exist or is frozen. Defaults to true.
            * flag (uint16) - sets flag which used to send the internal outbound message. Defaults to 0.
            * body (TvmCell) - body (payload) attached to the internal message. Defaults to an empty TvmCell.
            All parameters can be omitted, except value.
            
            Possible values of parameter flag:
            
            * 0 - carries funds equal to parameter value to destination. Forward fee is subtracted from parameter value.
            * 128 - carries all the remaining balance of the current smart contract. Parameter value is ignored. The contract's balance will be equal to zero.
            * 64 - carries funds equal to parameter value and all the remaining value of the inbound message.
            Parameter flag can also be modified:
            
            * flag + 1 - means that the sender wants to pay transfer fees separately from contract's balance.
            * flag + 2 - means that any errors arising while processing this message during the action phase should be ignored.
            * flag + 32 - means that the current account must be destroyed if its resulting balance is zero. For example, flag: 128 + 32 is used to send all balance and destroy the contract.`,
            kind: CompletionItemKind.Property,
            label: 'transfer',
        },
    ]
}

function getMappingCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Returns the item of ValueType with index key. Throws an exception if key is not in the mapping.',
            kind: CompletionItemKind.Property,
            label: 'at',
        },
        {
            detail: 'Computes the minimal key in the mapping and returns an optional value containing that key and the associated value. If mapping is empty, this function returns an empty optional.',
            kind: CompletionItemKind.Property,
            label: 'min',
        },
        {
            detail: 'Computes the maximal key in the mapping and returns an optional value containing that key and the associated value. If mapping is empty, this function returns an empty optional.',
            kind: CompletionItemKind.Property,
            label: 'max',
        },
        {
            detail: `Computes the maximal key in the mapping that is lexicographically less than key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.`,
            kind: CompletionItemKind.Property,
            label: 'next',
        },
        {
            detail: `Computes the minimal key in the mapping that is lexicographically greater than key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.`,
            kind: CompletionItemKind.Property,
            label: 'prev',
        },
        {
            detail: `Computes the maximal key in the mapping that is lexicographically less than or equal to key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.`,
            kind: CompletionItemKind.Property,
            label: 'nextOrEq',
        },
        {
            detail: `Computes the minimal key in the mapping that is lexicographically greater than or equal to key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.`,
            kind: CompletionItemKind.Property,
            label: 'prevOrEq',
        },
        {
            detail: `If mapping is not empty then this function computes the minimal key of the mapping, deletes that key and the associated value from the mapping and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key.`,
            kind: CompletionItemKind.Property,
            label: 'delMin',
        },
        {
            detail: `If mapping is not empty then this function computes the maximum key of the mapping, deletes that key and the associated value from the mapping and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key.`,
            kind: CompletionItemKind.Property,
            label: 'delMax',
        },
        {
            detail: `Checks whether key presents in the mapping and returns an optional with the associated value. Returns an empty optional if there is no such key.`,
            kind: CompletionItemKind.Property,
            label: 'fetch',
        },
        {
            detail: `Returns a status flag whether key presents in the mapping.`,
            kind: CompletionItemKind.Property,
            label: 'exists',
        },
        {
            detail: `Returns a status flag whether the mapping is empty.`,
            kind: CompletionItemKind.Property,
            label: 'empty',
        },
        {
            detail: `Sets the value associated with key only if key presents in the mapping and returns the success flag.`,
            kind: CompletionItemKind.Property,
            label: 'replace',
        },
        {
            detail: `Sets the value associated with key only if key does not present in the mapping.`,
            kind: CompletionItemKind.Property,
            label: 'add',
        },
        {
            detail: `Sets the value associated with key, but also returns an optional with the old value associated with the key, if presents. Otherwise, returns an empty optional.`,
            kind: CompletionItemKind.Property,
            label: 'getSet',
        },
        {
            detail: `Sets the value associated with key, but only if key does not present in the mapping. Returns an optional with the old value without changing the dictionary if that value presents in the mapping, otherwise returns an empty optional.`,
            kind: CompletionItemKind.Property,
            label: 'getAdd',
        },
        {
            detail: `Sets the value associated with key, but only if key presents in the mapping. On success, returns an optional with the old value associated with the key. Otherwise, returns an empty optional.`,
            kind: CompletionItemKind.Property,
            label: 'getReplace',
        },
    ]
}

function getBytesCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Returns length of the byte array.',
            kind: CompletionItemKind.Property,
            label: 'length',
        },
        {
            detail: `Converts bytes to TvmSlice.
            Warning: if length of the array is greater than 127 then extra bytes are stored in the first reference of the slice. Use <TvmSlice>.loadRef() to load that extra bytes.`,
            kind: CompletionItemKind.Property,
            label: 'toSlice',
        },
        {
            detail: 'Returns status flag whether the bytes is empty (its length is 0).',
            kind: CompletionItemKind.Property,
            label: 'empty',
        },
        {
            detail: 'Same as <TvmCell>.dataSize().',
            kind: CompletionItemKind.Property,
            label: 'dataSize',
        },
        {
            detail: 'Same as <TvmCell>.dataSizeQ().',
            kind: CompletionItemKind.Property,
            label: 'dataSizeQ',
        },
        {
            detail: 'Modifies the bytes by concatenating tail bytes to the end of the bytes.',
            kind: CompletionItemKind.Property,
            label: 'append',
        },
    ]
}

function getVectorCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Appends obj to the vector.',
            kind: CompletionItemKind.Property,
            label: 'push',
        },
        {
            detail: 'Pops the last value from the vector and returns is.',
            kind: CompletionItemKind.Property,
            label: 'pop',
        },
        {
            detail: 'Returns length of the vector.',
            kind: CompletionItemKind.Property,
            label: 'length',
        },
        {
            detail: 'Checks whether the vector is empty.',
            kind: CompletionItemKind.Property,
            label: 'empty',
        },
    ]
}

function getTvmCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Executes TVM instruction "ACCEPT" (TVM - A.11.2. - F800). This instruction sets current gas limit to its maximal allowed value. This action is required to process external messages, which bring no value.',
            kind: CompletionItemKind.Property,
            label: 'accept',
        },
        {
            detail: 'Creates a "check point" of the state variables (by copying them from c7 to c4) and register c5. If the contract throws an exception at the computing phase then the state variables and register c5 will roll back to the "check point", and the computing phase will be considered "successful". If contract doesn`t throw an exception, it has no effect.',
            kind: CompletionItemKind.Property,
            label: 'commit',
        },
        {
            detail: 'Same as tvm.commit() but doesn`t copy the state variables from c7 to c4. It`s a wrapper for opcode COMMIT.',
            kind: CompletionItemKind.Property,
            label: 'rawCommit',
        },
        {
            detail: `It's an experimental function.
            A dual of the tvm.setData() returning value of c4 register. Getting a raw storage cell is useful when upgrading a new version of contract that introduces an altered data layout.
            Manipulation with a raw storage cell requires an understanding of the way the compiler layouts the data. Refer to the description of tvm.setData() below to get more details.`,
            kind: CompletionItemKind.Property,
            label: 'getData',
        },
        {
            detail: `It's an experimental function.
            Set cell data to register c4. Note, after returning from a public function all state variable from c7 will copy to c4 and tvm.setData will have no effect. Example of usage of such hint to set c4:
                TvmCell data = ...;
                tvm.setData(data); // set register c4
                tvm.rawCommit();   // save register c4 and c5
            revert(200);       // throw the exception to terminate the transaction
            Be careful with the hidden state variable timestamp and think about possibility of replaying external messages.`,
            kind: CompletionItemKind.Property,
            label: 'setData',
        },
        {
            detail: `Dumps log string. This function is wrapper for TVM instructions PRINTSTR (for constant literal strings shorter than 16 symbols) and STRDUMP (for other strings). logtvm is an alias for tvm.log(string)`,
            kind: CompletionItemKind.Property,
            label: 'log',
        },
        {
            detail: `Dumps cell data or integer in hex format. Note that for cells this function dumps data only from the first cell. T must be an integer type or TvmCell.`,
            kind: CompletionItemKind.Property,
            label: 'hexdump',
        },
        {
            detail: `Dumps cell data or integer in bin format. Note that for cells this function dumps data only from the first cell. T must be an integer type or TvmCell.`,
            kind: CompletionItemKind.Property,
            label: 'bindump',
        },
        {
            detail: `This command creates an output action that would change this smart contract code to that given by Cell newCode (this change will take effect only after the successful termination of the current run of the smart contract).`,
            kind: CompletionItemKind.Property,
            label: 'setcode',
        },
        {
            detail: `Executes TVM instruction "CONFIGPARAM" (TVM - A.11.4. - F832). This command returns the value of the global configuration parameter with integer index paramNumber. Argument should be an integer literal. Supported paramNumbers: 1, 15, 17, 34.`,
            kind: CompletionItemKind.Property,
            label: 'configParam',
        },
        {
            detail: `Executes TVM instruction "CONFIGPARAM" (TVM - A.11.4. - F832). This command returns the value of the global configuration parameter with integer index paramNumber as a cell and a boolean status.`,
            kind: CompletionItemKind.Property,
            label: 'rawConfigParam',
        },
        {
            detail: `Creates an output action which reserves reserve nanotons. It is roughly equivalent to create an outbound message carrying reserve nanotons to oneself, so that the subsequent output actions would not be able to spend more money than the remainder. It's a wrapper for opcodes "RAWRESERVE" and "RAWRESERVEX". See TVM.

            Les's denote:
            
            original_balance is balance of the contract before compute phase, which is equal to balance of the contract before the transaction minus storage fee. Note: original_balance doesn't include msg.value and original_balance is not equal to address(this).balance.
            remaining_balance is contract's current remaining balance at the action phase after some handled actions and before handing the "rawReserve" action.
            Let's consider how much nanotons (reserve) are reserved in all cases of flag:
            
            0 -> reserve = value nanotons.
            
            1 -> reserve = remaining_balance - value nanotons.
            
            2 -> reserve = min(value, remaining_balance) nanotons.
            
            3 = 2 + 1 -> reserve = remaining_balance - min(value, remaining_balance) nanotons.
            
            4 -> reserve = original_balance + value nanotons.
            
            5 = 4 + 1 -> reserve = remaining_balance - (original_balance + value) nanotons.
            
            6 = 4 + 2 -> reserve = min(original_balance + value, remaining_balance) = remaining_balance nanotons.
            
            7 = 4 + 2 + 1 -> reserve = remaining_balance - min(original_balance + value, remaining_balance) nanotons.
            
            12 = 8 + 4 -> reserve = original_balance - value nanotons.
            
            13 = 8 + 4 + 1 -> reserve = remaining_balance - (original_balance - value) nanotons.
            
            14 = 8 + 4 + 2 -> reserve = min(original_balance - value, remaining_balance) nanotons.
            
            15 = 8 + 4 + 2 + 1 -> reserve = remaining_balance - min(original_balance - value, remaining_balance) nanotons.
            
            All other values of flag are invalid.
            
            To make it clear, let's consider the order of reserve calculation:
            
            1 if flag has bit +8 then value = -value.
            2 if flag has bit +4 then value += original_balance.
            3 Check value >= 0.
            4 if flag has bit +2 then value = min(value, remaining_balance).
            5 if flag has bit +1 then value = remaining_balance - value.
            6 reserve = value.
            7 Check 0 <= reserve <= remaining_balance.`,
            kind: CompletionItemKind.Property,
            label: 'rawReserve',
        },
        {
            detail: `Executes TVM instruction "HASHCU" or "HASHSU" (TVM - A.11.6. - F900). It computes the representation hash of a given argument and returns it as a 256-bit unsigned integer. For string and bytes it computes hash of the tree of cells, which contains data, but not data itself. See sha256 to count hash of data.`,
            kind: CompletionItemKind.Property,
            label: 'hash',
        },
        {
            detail: `Executes TVM instruction "CHKSIGNU" (TVM - A.11.6. - F910) for variants 1 and 2. This command checks the Ed25519-signature of a hash using public key pubkey. Signature is represented by two uint256 SignHighPart and SignLowPart in the first variant and by a slice signature in the second variant. In the third variant executes TVM instruction "CHKSIGNS" (TVM - A.11.6. - F911). This command checks Ed25519-signature of data using public key pubkey. Signature is represented by a slice signature.`,
            kind: CompletionItemKind.Property,
            label: 'checkSign',
        },
        {
            detail: `Inserts a public key into stateInit data field. If stateInit has wrong format then throws exception.`,
            kind: CompletionItemKind.Property,
            label: 'insertPubkey',
        },
        {
            detail: `Generates a StateInit (TBLKCH - 3.1.7.) from code and data. Member splitDepth of the tree of cell StateInit:

            1 is not set. Has no value.
            2 is set. 0 <= splitDepth <= 31
            3 Arguments can also be set with names. List of possible names:
            * code (TvmCell) - defines the code field of the StateInit. Must be specified.
            * data (TvmCell) - defines the data field of the StateInit. Conflicts with pubkey and varInit. Can be omitted, in this case data field would be build from pubkey and varInit.
            * splitDepth (uint8) - splitting depth. 0 <= splitDepth <= 31. Can be omitted. By default, it has no value.
            * pubkey (uint256) - defines the public key of the new contract. Conflicts with data. Can be omitted, default value is 0.
            * varInit (initializer list) - used to set static variables of the contract which StateInit is built. Conflicts with data and requires contr to be set. Can be omitted.
            * contr (contract) - defines the contract which StateInit is built. Mandatory to be set if the option varInit is specified.`,
            kind: CompletionItemKind.Property,
            label: 'buildStateInit',
        },
        {
            detail: `Generates a persistent storage of the contract that contains only public key. data can be used to generate StateInit (TBLKCH - 3.1.7.).`,
            kind: CompletionItemKind.Property,
            label: 'buildEmptyData',
        },
        {
            detail: `Deploys a new contract and returns the address of the deployed contract. This function may be useful if you want to write a universal contract that can deploy any contract. In another cases, use Deploy via new. Arguments:

            * stateInit - contract's StateInit.
            * payload - encoded internal inbound message. This message should contain the function (constructor) id and encoded parameters of constructor.
            * value - funds in nanotons that will be sent to the new contract address.
            * wid - workchain id of the new contract address.
            payload can be generated manually by tvm-linker tool.`,
            kind: CompletionItemKind.Property,
            label: 'deploy',
        },
        {
            detail: `Returns contract's code.`,
            kind: CompletionItemKind.Property,
            label: 'code',
        },
        {
            detail: `If code contains salt then optSalt contains one. Otherwise, optSalt doesn't contain any value.`,
            kind: CompletionItemKind.Property,
            label: 'codeSalt',
        },
        {
            detail: `Inserts salt into code and returns new code newCode.`,
            kind: CompletionItemKind.Property,
            label: 'setCodeSalt',
        },
        {
            detail: `Returns contract's public key, stored in contract data. If key is not set, function returns 0.`,
            kind: CompletionItemKind.Property,
            label: 'pubkey',
        },
        {
            detail: `Set new contract's public key. Contract's public key can be obtained from tvm.pubkey.`,
            kind: CompletionItemKind.Property,
            label: 'setPubkey',
        },
        {
            detail: `Changes this smart contract current code to that given by Cell newCode. Unlike tvm.setcode() this function changes code of the smart contract only for current TVM execution, but has no effect after termination of the current run of the smart contract.`,
            kind: CompletionItemKind.Property,
            label: 'setCurrentCode',
        },
        {
            detail: `Resets all state variables to their default values.`,
            kind: CompletionItemKind.Property,
            label: 'resetStorage',
        },
        {
            detail: `Returns a function id (uint32) for public/external function or constructor.`,
            kind: CompletionItemKind.Property,
            label: 'functionId',
        },
        {
            detail: `Constructs a function call message body that can be used as the payload for <address>.transfer(). If function is responsible then callbackFunction parameter must be set.`,
            kind: CompletionItemKind.Property,
            label: 'encodeBody',
        },
        {
            detail: `Functions are used to save state variables and to quickly terminate execution of the smart contract.
            Exit codes are equal to zero and one for tvm.exit and tvm.exit1 respectively.`,
            kind: CompletionItemKind.Property,
            label: 'exit',
        },
        {
            detail: `Functions are used to save state variables and to quickly terminate execution of the smart contract.
            Exit codes are equal to zero and one for tvm.exit and tvm.exit1 respectively.`,
            kind: CompletionItemKind.Property,
            label: 'exit1',
        },
        {
            detail: `Function should be used only offchain and intended to be used only in debot contracts. Allows creating an external inbound message, that calls the func function of the contract on address destination with specified function arguments.

            Mandatory parameters that are used to form a src address field that is used for debots:
            
            * abiVer - ABI version.
            * callbackId - identifier of the callback function.
            * onErrorId - identifier of the function that is called in case of error.
            * signBoxHandle - handle of the sign box entity, that engine will use to sign the message.
            These parameters are stored in addr_extern and placed to the src field of the message. Message is of type ext_in_msg_info and src addr is of type addr_extern but stores special data:
            
            * callback id - 32 bits;
            * on error id - 32 bits;
            * abi version - 8 bits;
            * header mask - 3 bits in such order: time, expire, pubkey;
            * optional value signBoxHandle - 1 bit (whether value presents) + [32 bits].
            Other function parameters define fields of the message:
            
            * time - message creation timestamp. Used for replay attack protection, encoded as 64 bit Unix time in milliseconds.
            * expire - Unix time (in seconds, 32 bit) after that message should not be processed by contract.
            * pubkey - public key from key pair used for signing the message body. This parameter is optional and can be omitted.
            * sign - constant bool flag that shows whether message should contain signature. If set to true, message is generated with signature field filled with zeroes. This parameter is optional and can be omitted (in this case is equal to false).
            User can also attach stateInit to the message using stateInit parameter.
            
            Function throws an exception with code 64 if function is called with wrong parameters (pubkey is set and has value, but sign is false or omitted).`,
            kind: CompletionItemKind.Property,
            label: 'buildExtMsg',
        },
        {
            detail: `Generates an internal outbound message that contains function call. The cell can be used to send a message using tvm.sendrawmsg(). If the function is responsible then
            callbackFunction parameter must be set.
            
            dest, value and call parameters are mandatory. Another parameters can be omitted. See <address>.transfer() where these options and their default values are described.`,
            kind: CompletionItemKind.Property,
            label: 'buildIntMsg',
        },
        {
            detail: `Send the internal/external message msg with flag. It's wrapper for opcode SENDRAWMSG (TVM - A.11.10). Internal message msg can be generated by tvm.buildIntMsg(). Possible values of flag are described here: <address>.transfer().`,
            kind: CompletionItemKind.Property,
            label: 'sendrawmsg',
        },
    ];
}

function getTvmCellCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Returns the depth of TvmCell c. If c has no references, then d = 0; otherwise d is one plus the maximum of depths of cells referred to from c. If c is a Null instead of a Cell, returns zero.',
            kind: CompletionItemKind.Property,
            label: 'depth',
        },
        {
            detail: `Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then a cell overflow exception (8) is thrown.
            This function is a wrapper for opcode "CDATASIZE".`,
            kind: CompletionItemKind.Property,
            label: 'dataSize',
        },
        {
            detail: `Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then this function returns an optional that has no value.
            This function is a wrapper for opcode "CDATASIZEQ".`,
            kind: CompletionItemKind.Property,
            label: 'dataSizeQ',
        },
        {
            detail: `Converts the cell to a slice.`,
            kind: CompletionItemKind.Property,
            label: 'toSlice',
        },
    ]
}

function getTvmSliceCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Checks whether a Slice is empty (i.e., contains no bits of data and no cell references).',
            kind: CompletionItemKind.Property,
            label: 'empty',
        },
        {
            detail: `Returns number of data bits and references in the slice.`,
            kind: CompletionItemKind.Property,
            label: 'size',
        },
        {
            detail: `Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then this function returns an optional that has no value. Note that the returned count of distinct cells does not take into account the cell that contains the slice itself.
            This function is a wrapper for opcode SDATASIZEQ`,
            kind: CompletionItemKind.Property,
            label: 'dataSizeQ',
        },
        {
            detail: `Returns number of data bits in the slice.`,
            kind: CompletionItemKind.Property,
            label: 'bits',
        },
        {
            detail: `Returns number of references in the slice.`,
            kind: CompletionItemKind.Property,
            label: 'refs',
        },
        {
            detail: `Returns number of data bits and references in the slice.`,
            kind: CompletionItemKind.Property,
            label: 'bitsAndRefs',
        },
        {
            detail: `Returns the depth of the slice. If slice has no references, then 0 is returned, otherwise function result is one plus the maximum of depths of the cells referred to from the slice.`,
            kind: CompletionItemKind.Property,
            label: 'depth',
        },
        {
            detail: `Checks whether the slice contains the specified amount of data bits.`,
            kind: CompletionItemKind.Property,
            label: 'hasNBits',
        },
        {
            detail: `Checks whether the slice contains the specified amount of data references.`,
            kind: CompletionItemKind.Property,
            label: 'hasNRefs',
        },
        {
            detail: `Checks whether the slice contains the specified amount of data bits and references.`,
            kind: CompletionItemKind.Property,
            label: 'hasNBitsAndRefs',
        },
        {
            detail: `Lexicographically compares the slice and other data bits of the root slice and returns result as an integer:

            1 - slice > other
            0 - slice == other
            -1 - slice < other
            `,
            kind: CompletionItemKind.Property,
            label: 'compare',
        },
        {
            detail: `Supported types: uintN, intN, bytesN, bool, ufixedMxN, fixedMxN, address, contract, TvmCell, bytes, string, mapping, ExtraCurrencyCollection, array, optional and struct.`,
            kind: CompletionItemKind.Property,
            label: 'decode',
        },
        {
            detail: `Loads a cell from the slice reference.`,
            kind: CompletionItemKind.Property,
            label: 'loadRef',
        },
        {
            detail: `Loads a cell from the slice reference and converts it into a slice.`,
            kind: CompletionItemKind.Property,
            label: 'loadRefAsSlice',
        },
        {
            detail: `Loads a signed integer with the given bitSize from the slice.`,
            kind: CompletionItemKind.Property,
            label: 'loadSigned',
        },
        {
            detail: `Loads an unsigned integer with the given bitSize from the slice.`,
            kind: CompletionItemKind.Property,
            label: 'loadUnsigned',
        },
        {
            detail: `Loads (deserializes) VarUInteger 16 and returns an unsigned 128-bit integer. See TL-B scheme.`,
            kind: CompletionItemKind.Property,
            label: 'loadTons',
        },
        {
            detail: `Loads the first length bits and refs references from the slice into a separate slice.`,
            kind: CompletionItemKind.Property,
            label: 'loadSlice',
        },
        {
            detail: `Decodes parameters of the function or constructor (if contract type is provided). This function is usually used in onBounce function.`,
            kind: CompletionItemKind.Property,
            label: 'decodeFunctionParams',
        },
        {
            detail: `Skips the first length bits and refs references from the slice.`,
            kind: CompletionItemKind.Property,
            label: 'skip',
        },
    ]
}

function getTvmBuilderCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'Converts the builder into a slice.',
            kind: CompletionItemKind.Property,
            label: 'toSlice',
        },
        {
            detail: `Converts the builder into a cell.`,
            kind: CompletionItemKind.Property,
            label: 'toCell',
        },
        {
            detail: `Returns the number of data bits already stored in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'bits',
        },
        {
            detail: `Returns the number of references already stored in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'refs',
        },
        {
            detail: `Returns the number of data bits and references already stored in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'bitsAndRefs',
        },
        {
            detail: `Returns the number of data bits that can still be stored in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'remBits',
        },
        {
            detail: `Returns the number of references that can still be stored in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'remRefs',
        },
        {
            detail: `Returns the number of data bits and references that can still be stored in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'remBitsAndRefs',
        },
        {
            detail: `Returns the depth of the builder. If no cell references are stored in the builder, then 0 is returned; otherwise function result is one plus the maximum of depths of cells referred to from the builder.`,
            kind: CompletionItemKind.Property,
            label: 'depth',
        },
        {
            detail: `Stores the list of values in the builder.

            Internal representation of the stored data:
            
            * uintN/intN/bytesN - stored as an N-bit string. For example, uint8(100), int16(-3), bytes2(0xaabb) stored as 0x64fffdaabb.
            * bool - stored as a binary zero for false or a binary one for true. For example, true, false, true stored as 0xb_.
            * ufixedMxN/fixedMxN - stored as an M-bit string.
            * address/contract - stored according to the TL-B scheme of MsgAddress.
            * TvmCell/bytes/string - stored as a cell in reference.
            * TvmSlice/TvmBuilder - all data bits and references of the TvmSlice or the TvmBuilder are appended to the builder. Not in a reference as TvmCell. To store TvmSlice/TvmBuilder in the references use <TvmBuilder>.storeRef().
            * mapping/ExtraCurrencyCollection - stored according to the TL-B scheme of HashmapE: if map is empty then stored as a binary zero; else as a binary one and the dictionary Hashmap in a reference.
            * array - stored as a 32 bit value - size of the array and a HashmapE that contains all values of the array.
            * optional - stored as a binary zero if the optional doesn't contain value. Otherwise, stored as a binary one and the cell with serialized value in a reference.
            * struct - stored in the order of its members in the builder. Make sure the entire struct fits into the builder.
            Note: there are no gapes or offsets between two consecutive data assets stored in the builder.
            
            See TVM to read about notation for bit strings.`,
            kind: CompletionItemKind.Property,
            label: 'store',
        },
        {
            detail: `Stores n binary ones into Builder.`,
            kind: CompletionItemKind.Property,
            label: 'storeOnes',
        },
        {
            detail: `Stores n binary zeroes into Builder.`,
            kind: CompletionItemKind.Property,
            label: 'storeZeroes',
        },
        {
            detail: `Stores a signed integer value with given bitSize in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'storeSigned',
        },
        {
            detail: `Stores an unsigned integer value with given bitSize in the builder.`,
            kind: CompletionItemKind.Property,
            label: 'storeUnsigned',
        },
        {
            detail: `Stores TvmBuilder b/TvmCell c/TvmSlice c in the reference of the builder.`,
            kind: CompletionItemKind.Property,
            label: 'storeRef',
        },
        {
            detail: `Stores (serializes) an integer value and stores it in the builder as VarUInteger 16. See TL-B scheme.`,
            kind: CompletionItemKind.Property,
            label: 'storeTons',
        },
    ]
}

function getAbiCompletionItems(): CompletionItem[] {
    return [
        {
            detail: 'encode(..) returs (bytes): ABI-encodes the given arguments',
            insertText: 'encode(${1:arg});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'encode',
        },
        {
            detail: 'encodePacked(..) returns (bytes): Performes packed encoding of the given arguments',
            insertText: 'encodePacked(${1:arg});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'encodePacked',
        },
        {
            detail: 'encodeWithSelector(bytes4,...) returns (bytes): ABI-encodes the given arguments starting from the second and prepends the given four-byte selector',
            insertText: 'encodeWithSelector(${1:bytes4}, ${2:arg});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'encodeWithSelector',
        },
        {
            detail: 'encodeWithSignature(string,...) returns (bytes): Equivalent to abi.encodeWithSelector(bytes4(keccak256(signature), ...)`',
            insertText: 'encodeWithSignature(${1:signatureString}, ${2:arg});',
            insertTextFormat: 2,
            kind: CompletionItemKind.Method,
            label: 'encodeWithSignature',
        },
    ];
}

function getRndCompletionItems(): CompletionItem[] {
    return [
        {
            detail: `Generates a new pseudo-random number.

            1. Returns uint256 number.
            2. If the first argument limit > 0 then function returns the value in the range 0..limit-1. Else if limit < 0 then the returned value lies in range limit..-1. Else if limit == 0 then it returns 0.`,
            kind: CompletionItemKind.Method,
            label: 'next',
        },
        {
            detail: `Returns the current random seed.`,
            kind: CompletionItemKind.Method,
            label: 'getSeed',
        },
        {
            detail: `Sets the random seed to x.`,
            kind: CompletionItemKind.Method,
            label: 'setSeed',
        },
        {
            detail: `Randomizes the random seed.
            (1) Mixes the random seed and someNumber. The result is set as the random seed.
            (2) Mixes the random seed and the logical time of the current transaction. The result is set as the random seed.`,
            kind: CompletionItemKind.Method,
            label: 'shuffle',
        },
        
    ]
}
