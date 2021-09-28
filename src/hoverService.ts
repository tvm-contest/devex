'use strict';
import { consoleTerminal } from 'tondev';
import { Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Function, SolidityCodeWalker, Variable } from './codeWalkerService';

export class HoverService {
    
    public rootPath: string;

    constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    public getHoverItems(packageDefaultDependenciesDirectory: string,
                            packageDefaultDependenciesContractsDirectory: string,
                            document: TextDocument,
                            position: Position) {
        let suggestion = null;
        let counter = 0;
        const lines = document.getText().split(/\r?\n/g);
        const wordLine = lines[position.line];

        const wordObject = this.getWord(wordLine, position.character);

        if (wordObject.word == "") {
            return null;
        }
        var walker = new SolidityCodeWalker(this.rootPath,  packageDefaultDependenciesDirectory,
            packageDefaultDependenciesContractsDirectory,
        );
        const offset = document.offsetAt(position);

        var documentContractSelected = walker.getAllContracts(document, position);

        let variableType: string = "global";
        if (documentContractSelected != undefined && documentContractSelected.selectedContract != undefined) {
            let allVariables: Variable[] = documentContractSelected.selectedContract.getAllStateVariables();
            let selectedFunction = documentContractSelected.selectedContract.getSelectedFunction(offset);
            if (selectedFunction !== undefined && selectedFunction !== null)  {
                selectedFunction.findVariableDeclarationsInScope(offset, null);
                //adding input parameters
                allVariables = allVariables.concat(selectedFunction.input);
                //ading all variables
                allVariables = allVariables.concat(selectedFunction.variablesInScope);
            }

            if (wordObject.word.indexOf(".") != -1) {
                const prefix = wordObject.word.split('.')[0];
                allVariables.forEach(item => {
                    if (item.name === prefix) {
                        if (item.type.isArray) {
                            variableType = "array";
                        } else if (item.type.isMapping) {
                            variableType = "mapping";
                        } else {
                            variableType = item.type.name;
                        }
                    }
                })
            }
        }

        for (const [, value] of Object.entries(hoverDescription)) {
            const re = new RegExp(`${value.pattern}$`);
            if (!wordObject.word.match(re)) continue;
            if (value.type != variableType) continue;
            if (Array.isArray(value.description)) {
                suggestion =  value.description.join("\n");
            } else {
                suggestion = value.description;
            }
        }
        return suggestion == null ? null : [suggestion];
    }

    private getWord(lineText: string, charecterPosition:number): any {
        let offsetStart = charecterPosition;
        let offsetEnd = charecterPosition;
        let wordStart = charecterPosition;
        let wordEnd = charecterPosition;
        const stopCharacters = [" ", "(", ")", "[", "]", ";", "!", "+", "-", "*", "/", "=", "&", "^", "%", "~"];
        while(offsetStart >= 0) {
            wordStart = offsetStart;
            if (stopCharacters.includes(lineText[offsetStart])) {
                break;
            }
            offsetStart--;
        }
        while(offsetEnd <= lineText.length) {
            wordEnd = offsetEnd;
            if (stopCharacters.includes(lineText[offsetEnd])) {
                break;
            }
            offsetEnd++;
        }
        const word = lineText.substr(wordStart+1, wordEnd-(wordStart+1));
        return {"start": wordStart,
                "end": wordEnd,
                "word": word
                }
    }
}

const hoverDescription = {
    "pragma ton-solidity": {
        "pattern": "solidity",
        "type": "global",
        "body": "pragma ton-solidity >= ${1:version};",
        "description": [
            "It's used to reject compilation source file with some versions of the compiler.\n",
            "Example:\n",
            "```\npragma ton-solidity >= 0.35.5; // Check compiler version is at least 0.35.5\n```",
            "```\npragma ton-solidity ^ 0.35.5; // Check compiler version is at least 0.35.5 and less 0.36.0\n```",
            "```\npragma ton-solidity \\< 0.35.5; // Check compiler version is less 0.35.5\n```\n"
        ]
    },
    "ignoreIntOverflow": {
        "pattern": "ignoreIntOverflow",
        "type": "global",
        "body": "ignoreIntOverflow;",
        "description": "Turns off binary operation result overflow check."
    },
    "pragma AbiHeader": {
        "pattern": "AbiHeader",
        "type": "global",
        "body": "pragma AbiHeader ${1|time,pubkey,expire|};",
        "description": [
            "Force message forming utility to fill an appropriate field(s) in the header of the exteranl inbound message to be sent to this contract:\n",
            " * pubkey - public key by which the message can be signed;",
            " * time - local time at what message was created;",
            " * expire - time at which message should be meant as expired."
        ]
    },
    "pragma msgValue": {
        "pattern": "msgValue",
        "type": "global",
        "body": "pragma msgValue ${1: value};",
        "description": [
            "```\npragma msgValue \\<value>;\n```\n",
            "Allows specifying default value in nanotons attached to the internal messages that contract sends to call another contract. If it's not specified, this value is set to 10 000 000 nanotons.\n",
            "Example:\n",
            "```\npragma msgValue 123456789;\n```",
            "```\npragma msgValue 1 ton;\n```\n"
        ]
    },
    "import contract": {
        "pattern": "import",
        "type": "global",
        "body": "import \"${1:contract}\";",
        "description": [
            "TON Solidity compiler allows user to import remote files using link starting with http. If import file name starts with http, then compiler tries to download the file using this link and saves it to the folder .solc_imports. If compiler fails to create this folder of to download the file, then an error is emitted.\n",
            "** Note: **to import file from GitHub, one should use link to the raw version of the file.\n",
            "Example:\n",
            "```\npragma ton-solidity >=0.35.0;\n```\n",
            "```\npragma AbiHeader expire;\n```\n",
            "```\npragma AbiHeader time;\n```\n",
            "```\npragma AbiHeader pubkey;\n```\n",
            "```\nimport \"https://github.com/tonlabs/debots/raw/9c6ca72b648fa51962224ec0d7ce91df2a0068c1/Debot.sol\";\n```",
            "```\nimport \"https://github.com/tonlabs/debots/raw/9c6ca72b648fa51962224ec0d7ce91df2a0068c1/Terminal.sol\";\n```",
            "```\ncontract HelloDebot is Debot {\n\\\\...\n}\n```"
        ]
    },
    "TvmCell": {
        "pattern": "TvmCell",
        "type": "global",
        "body": "TvmCell ${1:name}",
        "description": [
            "TvmCell represents TVM cell ([TVM](https://ton.org/tvm.pdf) - 1.1.3). The compiler defines the following operators and functions to work with this type:\n",
            "Operators:\n",
            " * Comparisons: ==, != (evaluate to bool)\n",
            "Methods:\n",
            " * ```\n <TvmCell>.depth() \n```",
            " * ```\n <TvmCell>.dataSize() \n```",
            " * ```\n <TvmCell>.dataSizeQ() \n```",
            " * ```\n <TvmCell>.toSlice() \n```"
        ]
    },
    "<TvmCell>.depth": {
        "pattern": ".depth",
        "type": "TvmCell",
        "body": ".depth()",
        "description": [
            "```\n<TvmCell>.depth() returns(uint64);\n```\n",
            "Returns the depth of TvmCell c. If c has no references, then d = 0; otherwise d is one plus the maximum of depths of cells referred to from c. If c is a Null instead of a Cell, returns zero."
        ]
    },
    "<TvmCell>.dataSize": {
        "pattern": ".dataSize",
        "type": "TvmCell",
        "body": ".dataSize(${uint n})",
        "description": [
            "```\n<TvmCell>.dataSize(uint n) returns (uint /\\*cells\\*/, uint /\\*bits\\*/, uint /\\*refs\\*/);\n```\n",
            "Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then a cell overflow exception (8) is thrown. This function is a wrapper for opcode \"CDATASIZE\" "
        ]
    },
    "<TvmCell>.dataSizeQ": {
        "pattern": ".dataSizeQ",
        "type": "TvmCell",
        "body": ".dataSizeQ(${uint n})",
        "description": [
            "```\n<TvmCell>.dataSizeQ(uint n) returns (optional(uint /\\*cells\\*/, uint /\\*bits\\*/, uint /\\*refs\\*/));\n```\n",
            "Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then this function returns an optional that has no value. This function is a wrapper for opcode \"CDATASIZEQ\" "
        ]
    },
    "<TvmCell>.toSlice": {
        "pattern": ".toSlice",
        "type": "TvmCell",
        "body": ".toSlice()",
        "description": [
            "```\n<TvmCell>.toSlice() returns (TvmSlice);\n```\n",
            "Converts the cell to a slice."
        ]
    },
    "TvmSlice": {
        "pattern": "TvmSlice",
        "type": "global",
        "body": "TvmSlice ${1:name}",
        "description": [
            "TvmSlice represents TVM cell slice ([TVM](https://ton.org/tvm.pdf) - 1.1.3). The compiler defines the following operators and functions to work with this type:\n",
            "Operators:\n",
            " * Comparisons: <=, <, ==, !=, >=, > (evaluate to bool). Note: only bit data from the root cells are compared, references are ignored.\n",
            "Methods:\n",
            " * ```\n <TvmSlice>.empty() \n```",
            " * ```\n <TvmSlice>.size() \n```",
            " * ```\n <TvmSlice>.dataSize \n```",
            " * ```\n <TvmSlice>.dataSizeQ() \n```",
            " * ```\n <TvmSlice>.bits() \n```",
            " * ```\n <TvmSlice>.refs() \n```",
            " * ```\n <TvmSlice>.bitsAndRefs() \n```",
            " * ```\n <TvmSlice>.depth() \n```",
            " * ```\n <TvmSlice>.hasNBits(), <TvmSlice>.hasNRefs() and <TvmSlice>.hasNBitsAndRefs() \n```",
            " * ```\n <TvmSlice>.compare()\n ```",
            "TvmSlice load primitives:\n",
            " * ```\n<TvmSlice>.decode() \n```",
            " * ```\n<TvmSlice>.loadRef() \n```",
            " * ```\n<TvmSlice>.loadRefAsSlice() \n```",
            " * ```\n<TvmSlice>.loadSigned() \n```",
            " * ```\n<TvmSlice>.loadUnsigned() \n```",
            " * ```\n<TvmSlice>.loadTons() \n```",
            " * ```\n<TvmSlice>.loadSlice() \n```",
            " * ```\n<TvmSlice>.decodeFunctionParams() \n```",
            " * ```\n<TvmSlice>.skip() \n```"
        ]
    },
    "<TvmSlice>.empty": {
        "pattern": ".empty",
        "type": "TvmSlice",
        "body": ".empty()",
        "description": [
            "```\n<TvmSlice>.empty() returns (bool);\n```\n",
            "Checks whether a Slice is empty (i.e., contains no bits of data and no cell references)."
        ]
    },
    "<TvmSlice>.size": {
        "pattern": ".size",
        "type": "TvmSlice",
        "body": ".size()",
        "description": [
            "```\n<TvmSlice>.size() returns (uint16 /\\*bits\\*/, uint8 /\\*refs\\*/);\n```\n",
            "Returns number of data bits and references in the slice."
        ]
    },
    "<TvmSlice>.dataSize": {
        "pattern": ".dataSize",
        "type": "TvmSlice",
        "body": ".dataSize(${uint n})",
        "description": [
            "```\n<TvmSlice>.dataSize(uint n) returns (uint /\\*cells\\*/, uint /\\*bits\\*/, uint /\\*refs\\*/);\n```\n",
            "Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then a cell overflow exception (8) is thrown. Note that the returned count of distinct cells does not take into account the cell that contains the slice itself. This function is a wrapper for opcode SDATASIZE"
        ]
    },
    "<TvmSlice>.dataSizeQ": {
        "pattern": ".dataSizeQ",
        "type": "TvmSlice",
        "body": ".dataSizeQ(${uint n})",
        "description": [
            "```\n<TvmSlice>.dataSizeQ(uint n) returns (optional(uint /\\*cells\\*/, uint /\\*bits\\*/, uint /\\*refs\\*/));\n```\n",
            "Returns the count of distinct cells, data bits in the distinct cells and cell references in the distinct cells. If count of the distinct cells exceeds n+1 then this function returns an optional that has no value. Note that the returned count of distinct cells does not take into account the cell that contains the slice itself. This function is a wrapper for opcode SDATASIZEQ"
        ]
    },
    "<TvmSlice>.bits": {
        "pattern": ".bits",
        "type": "TvmSlice",
        "body": ".bits()",
        "description": [
            "```\n<TvmSlice>.bits() returns (uint16);\n```\n",
            "Returns number of references in the slice."
        ]
    },
    "<TvmSlice>.refs": {
        "pattern": ".refs",
        "type": "TvmSlice",
        "body": ".refs()",
        "description": [
            "```\n<TvmSlice>.refs() returns (uint8);\n```\n",
            "Returns number of references in the slice."
        ]
    },
    "<TvmSlice>.bitsAndRefs": {
        "pattern": ".bitsAndRefs",
        "type": "TvmSlice",
        "body": ".bitsAndRefs()",
        "description": [
            "```\n<TvmSlice>.bitsAndRefs() returns (uint16, uint8);\n```\n",
            "Returns number of data bits and references in the slice."
        ]
    },
    "<TvmSlice>.depth": {
        "pattern": ".depth",
        "type": "TvmSlice",
        "body": ".depth()",
        "description": [
            "```\n<TvmSlice>.depth() returns (uint64);\n```\n",
            "Returns the depth of the slice. If slice has no references, then 0 is returned, otherwise function result is one plus the maximum of depths of the cells referred to from the slice."
        ]
    },
    "<TvmSlice>.hasNBits": {
        "pattern": ".hasNBits",
        "type": "TvmSlice",
        "body": ".hasNBits(${uint16 bits}))",
        "description": [
            "```\n<TvmSlice>.hasNBits(uint16 bits) returns (bool);\n```\n",
            "Checks whether the slice contains the specified amount of data bits."
        ]
    },
    "<TvmSlice>.hasNRefs": {
        "pattern": ".hasNRefs",
        "type": "TvmSlice",
        "body": ".hasNRefs(${uint8 bits}))",
        "description": [
            "```\n<TvmSlice>.hasNRefs(uint8 bits) returns (bool);\n```\n",
            "Checks whether the slice contains the specified amount of references."
        ]
    },
    "<TvmSlice>.hasNBitsAndRefs": {
        "pattern": ".hasNBitsAndRefs",
        "type": "TvmSlice",
        "body": ".hasNBitsAndRefs(${uint16 bits}, ${uint8 refs})",
        "description": [
            "```\n<TvmSlice>.hasNBitsAndRefs(uint16 bits, uint8 refs) returns (bool);\n```\n",
            "Checks whether the slice contains the specified amount of data bits and references."
        ]
    },
    "<TvmSlice>.compare": {
        "pattern": ".compare",
        "type": "TvmSlice",
        "body": ".compare(${1:TvmSlice other})",
        "description": [
            "```\n<TvmSlice>.compare(TvmSlice other) returns (int8);\n```\n",
            "Lexicographically compares the slice and other data bits of the root slice and returns result as an integer:\n",
            " * 1 - slice > other",
            " * 0 - slice == other",
            " * -1 - slice < other"
        ]
    },
    "<TvmSlice>.loadRef": {
        "pattern": ".loadRef",
        "type": "TvmSlice",
        "body": ".loadRef()",
        "description": [
            "```\n<TvmSlice>.loadRef() returns (TvmCell);\n```\n",
            "Loads a cell from the slice reference."
        ]
    },
    "<TvmSlice>.loadRefAsSlice": {
        "pattern": ".loadRefAsSlice",
        "type": "TvmSlice",
        "body": ".loadRefAsSlice()",
        "description": [
            "```\n<TvmSlice>.loadRefAsSlice() returns (TvmSlice);\n```\n",
            "Loads a cell from the slice reference and converts it into a slice."
        ]
    },
    "<TvmSlice>.loadSigned": {
        "pattern": ".loadSigned",
        "type": "TvmSlice",
        "body": ".loadSigned(${1:uint16 bitSize})",
        "description": [
            "```\n<TvmSlice>.loadSigned(uint16 bitSize) returns (int);\n```\n",
            "Loads a signed integer with the given bitSize from the slice."
        ]
    },
    "<TvmSlice>.loadUnsigned": {
        "pattern": ".loadSiloadUnsignedgned",
        "type": "TvmSlice",
        "body": ".loadUnsigned(${1:uint16 bitSize})",
        "description": [
            "```\n<TvmSlice>.loadSigned(uint16 bitSize) returns (uint);\n```\n",
            "Loads an unsigned integer with the given bitSize from the slice."
        ]
    },
    "<TvmSlice>.loadTons": {
        "pattern": ".loadTons",
        "type": "TvmSlice",
        "body": ".loadTons()",
        "description": [
            "```\n<TvmSlice>.loadTons() returns (uint128);\n```\n",
            "Loads (deserializes) VarUInteger 16 and returns an unsigned 128-bit integer."
        ]
    },
    "<TvmSlice>.loadSlice": {
        "pattern": ".loadSlice",
        "type": "TvmSlice",
        "body": ".loadSlice()",
        "description": [
            "```\n<TvmSlice>.loadSlice(uint length) returns (TvmSlice);\n```\n",
            "```\n<TvmSlice>.loadSlice(uint length, uint refs) returns (TvmSlice);\n```\n",
            "Loads the first length bits and refs references from the slice into a separate slice."
        ]
    },
    "<TvmSlice>.decodeFunctionParams": {
        "pattern": ".decodeFunctionParams",
        "type": "TvmSlice",
        "body": ".decodeFunctionParams(${1:functionName})",
        "description": [
            "Decodes parameters of the function or constructor (if contract type is provided). This function is usually used in onBounce function.\n",
            "Example:\n",
            "Decode parameters of the public function which doesn't return values:\n",
            "```\n<TvmSlice>.decodeFunctionParams(functionName) returns (TypeA /\\*a\\*/, TypeB /\\*b\\*/, ...);\n```\n",
            "Decode parameters of the public function which returns values:\n",
            "```\n<TvmSlice>.decodeFunctionParams(functionName) returns (uint32 callbackFunctionId, TypeA /\\*a\\*/, TypeB /\\*b\\*/, ...);\n```\n",
            "Decode constructor parameters:\n",
            "```\n\\<TvmSlice>.decodeFunctionParams(ContractName) returns (TypeA /\\*a\\*/, TypeB /\\*b\\*/, ...);\n```\n"
        ]
    },
    "<TvmSlice>.skip": {
        "pattern": ".skip",
        "type": "TvmSlice",
        "body": ".skip(${1:uint length}${0: ,uint refs})",
        "description": [
            "```\n<TvmSlice>.skip(uint length);\n```\n",
            "```\n<TvmSlice>.skip(uint length, uint refs);\n```\n",
            "Skips the first length bits and refs references from the slice."
        ]
    },
    "TvmBuilder": {
        "pattern": "TvmBuilder",
        "type": "global",
        "body": "TvmBuilder ${1:name}",
        "description": [
            "TvmBuilder represents TTVM cell builder ([TVM](https://ton.org/tvm.pdf) - 1.1.3). The compiler defines the following functions to work with this type:\n",
            " * ```\n <TvmBuilder>.toSlice() \n```",
            " * ```\n <TvmBuilder>.toCell() \n```",
            " * ```\n <TvmBuilder>.bits() \n```",
            " * ```\n <TvmBuilder>.refs() \n```",
            " * ```\n <TvmBuilder>.bitsAndRefs() \n```",
            " * ```\n <TvmBuilder>.remBits() \n```",
            " * ```\n <TvmBuilder>.remRefs() \n```",
            " * ```\n <TvmBuilder>.remBitsAndRefs() \n```",
            " * ```\n <TvmBuilder>.depth() \n```",
            " * ```\n <TvmBuilder>.store() \n```",
            " * ```\n <TvmBuilder>.storeOnes() \n```",
            " * ```\n <TvmBuilder>.storeZeroes() \n```",
            " * ```\n <TvmBuilder>.storeSigned() \n```",
            " * ```\n <TvmBuilder>.storeUnsigned() \n```",
            " * ```\n <TvmBuilder>.storeRef() \n```",
            " * ```\n <TvmBuilder>.storeTons() \n```"
        ]
    },
    "<TvmBuilder>.toSlice": {
        "pattern": ".toSlice",
        "type": "TvmBuilder",
        "body": ".toSlice()",
        "description": [
            "```\n<TvmBuilder>.toSlice() returns (TvmSlice);\n```\n",
            "Converts the builder into a slice."
        ]
    },
    "<TvmBuilder>.toCell": {
        "pattern": ".toCell",
        "type": "TvmBuilder",
        "body": ".toCell()",
        "description": [
            "```\n<TvmBuilder>.toCell() returns (TvmCell);\n```\n",
            "Converts the builder into a cell."
        ]
    },
    "<TvmBuilder>.bits": {
        "pattern": ".bits",
        "type": "TvmBuilder",
        "body": ".bits()",
        "description": [
            "```\n<TvmBuilder>.bits() returns (uint16);\n```\n",
            "Returns the number of data bits already stored in the builder."
        ]
    },
    "<TvmBuilder>.refs": {
        "pattern": ".refs",
        "type": "TvmBuilder",
        "body": ".refs()",
        "description": [
            "```\n<TvmBuilder>.refs() returns (uint8);\n```\n",
            "Returns the number of references already stored in the builder."
        ]
    },
    "<TvmBuilder>.bitsAndRefs": {
        "pattern": ".bitsAndRefs",
        "type": "TvmBuilder",
        "body": ".bitsAndRefs()",
        "description": [
            "```\n<TvmBuilder>.bitsAndRefs() returns (uint16 /\\*bits\\*/, uint8 /\\*refs\\*/);\n```\n",
            "Returns the number of data bits and references already stored in the builder."
        ]
    },
    "<TvmBuilder>.remBits": {
        "pattern": ".remBits",
        "type": "TvmBuilder",
        "body": ".remBits()",
        "description": [
            "```\n<TvmBuilder>.remBits() returns (uint16);\n```\n",
            "Returns the number of data bits that can still be stored in the builder."
        ]
    },
    "<TvmBuilder>.remRefs": {
        "pattern": ".remRefs",
        "type": "TvmBuilder",
        "body": ".remRefs()",
        "description": [
            "```\n<TvmBuilder>.remRefs() returns (uint8);\n```\n",
            "Returns the number of references that can still be stored in the builder."
        ]
    },
    "<TvmBuilder>.remBitsAndRefs": {
        "pattern": ".remBitsAndRefs",
        "type": "TvmBuilder",
        "body": ".remBitsAndRefs()",
        "description": [
            "```\n<TvmBuilder>.remBitsAndRefs() returns (uint16 /\\*bits\\*/, uint8 /\\*refs\\*/);\n```\n",
            "Returns the number of data bits and references that can still be stored in the builder."
        ]
    },
    "<TvmBuilder>.depth": {
        "pattern": ".depth",
        "type": "TvmBuilder",
        "body": ".depth()",
        "description": [
            "```\n<TvmBuilder>.depth() returns (uint64);\n```\n",
            "Returns the depth of the builder. If no cell references are stored in the builder, then 0 is returned; otherwise function result is one plus the maximum of depths of cells referred to from the builder."
        ]
    },
    "<TvmBuilder>.store": {
        "pattern": ".store",
        "type": "TvmBuilder",
        "body": ".store(${list_of_values})",
        "description": [
            "```\n<TvmBuilder>.store(list_of_values);\n```\n",
            "Stores the list of values in the builder.\n",
            "Example:\n",
            "```\nuint8 a = 11;\n```\n",
            "```\nint16 b = 22;\n```\n",
            "```\nTvmBuilder builder;\n```\n",
            "```\nbuilder.store(a, b, uint(33));\n```\n"
        ]
    },
    "<TvmBuilder>.storeOnes": {
        "pattern": ".storeOnes",
        "type": "TvmBuilder",
        "body": ".storeOnes(${1:uint n})",
        "description": [
            "```\n<TvmBuilder>.storeOnes(uint n);\n```\n",
            "Stores n binary ones into Builder."
        ]
    },
    "<TvmBuilder>.storeZeroes": {
        "pattern": ".storeZeroes",
        "type": "TvmBuilder",
        "body": ".storeZeroes(${1:uint n})",
        "description": [
            "```\n<TvmBuilder>.storeZeroes(uint n);\n```\n",
            "Stores n binary zeroes into Builder."
        ]
    },
    "<TvmBuilder>.storeSigned": {
        "pattern": ".storeSigned",
        "type": "TvmBuilder",
        "body": ".storeSigned(${1:int256 value}, ${2:uint16 bitSize})",
        "description": [
            "```\n<TvmBuilder>.storeSigned(int256 value, uint16 bitSize);\n```\n",
            "Stores a signed integer value with given bitSize in the builder."
        ]
    },
    "<TvmBuilder>.storeUnsigned": {
        "pattern": ".storeUnsigned",
        "type": "TvmBuilder",
        "body": ".storeUnsigned(${1:uint256 value}, ${2:uint16 bitSize})",
        "description": [
            "```\n<TvmBuilder>.storeUnsigned(uint256 value, uint16 bitSize);\n```\n",
            "Stores an unsigned integer value with given bitSize in the builder."
        ]
    },
    "<TvmBuilder>.storeRef": {
        "pattern": ".storeRef",
        "type": "TvmBuilder",
        "body": ".storeRef(${1|TvmBuilder b,TvmCell c,TvmSlice s|})",
        "description": [
            "```\n<TvmBuilder>.storeRef(TvmBuilder b);\n```\n",
            "```\n<TvmBuilder>.storeRef(TvmCell c);\n```\n",
            "```\n<TvmBuilder>.storeRef(TvmSlice s);\n```\n",
            "Stores TvmBuilder b/TvmCell c/TvmSlice c in the reference of the builder."
        ]
    },
    "<TvmBuilder>.storeTons": {
        "pattern": ".storeTons",
        "type": "TvmBuilder",
        "body": ".storeTons(${1:uint128 value}})",
        "description": [
            "```\n<TvmBuilder>.storeTons(uint128 value);\n```\n",
            "Stores (serializes) an integer value and stores it in the builder as VarUInteger 16. See TL-B scheme."
        ]
    },
    "<optional(Type)>.get": {
        "pattern": ".get",
        "type": "optional",
        "body": ".get()",
        "description": [
            "```\n<optional(Type)>.get() returns (Type);\n```\n",
            "Returns the contained value, if the optional contains one. Otherwise, throws an exception."
        ]
    },
    "<optional(Type)>.hasValue": {
        "pattern": ".hasValue",
        "type": "optional",
        "body": ".hasValue()",
        "description": [
            "```\n<optional(Type)>.hasValue() returns (bool);\n```\n",
            "Checks whether opt contains a value."
        ]
    },
    "<vector(Type)>.push": {
        "pattern": ".push",
        "type": "vector",
        "body": ".push(${1:Type obj})",
        "description": [
            "```\n<vector(Type)>.push(Type obj);\n```\n",
            "Appends obj to the vector.\n",
            "Example:\n",
            "```\nvector(uint) vect;\n```\n",
            "```\nuint a = 11;\n```\n",
            "```\nvect.push(a);\n```\n",
            "```\nvect.push(111);\n```\n"
        ]
    },
    "<vector(Type)>.pop": {
        "pattern": ".pop",
        "type": "vector",
        "body": ".pop()",
        "description": [
            "```\n<vector(Type)>.pop() returns (Type);\n```\n",
            "Pops the last value from the vector and returns is.\n",
            "Example:\n",
            "```\nvector(uint) vect;\n```\n",
            "...\n",
            "```\nuint a = vect.pop();\n```\n"
        ]
    },
    "<vector(Type)>.length": {
        "pattern": ".length",
        "type": "vector",
        "body": ".length()",
        "description": [
            "```\n<vector(Type)>.length() returns (uint8);\n```\n",
            "Returns length of the vector.\n",
            "Example:\n",
            "```\nvector(uint) vect;\n```\n",
            "...\n",
            "```\nuint8 len = vect.length();\n```\n"
        ]
    },
    "<vector(Type)>.empty": {
        "pattern": ".empty",
        "type": "vector",
        "body": ".empty()",
        "description": [
            "```\n<vector(Type)>.empty() returns (bool);\n```\n",
            "Checks whether the vector is empty.\n",
            "Example:\n",
            "```\nvector(uint) vect;\n```\n",
            "...\n",
            "```\nbool is_empty = vect.empty();\n```\n"
        ]
    },
    "bitSize": {
        "pattern": "bitSize",
        "type": "global",
        "body": "bitSize(${1:int x})",
        "description": [
            "bitSize(int x) returns (uint16)",
            "bitSize computes the smallest c ≥ 0 such that x fits into a c-bit signed integer (−2c−1 ≤ x < 2c−1).\n",
            "Example:\n",
            "require(bitSize(12) == 5); // 12 == 1100(in bin sys)",
            "```\nrequire(bitSize(1) == 2);\n```\n",
            "```\nrequire(bitSize(-1) == 1);\n```\n",
            "```\nrequire(bitSize(0) == 0);\n```\n"
        ]
    },
    "uBitSize": {
        "pattern": "uBitSize",
        "type": "global",
        "body": "uBitSize(${1:uint x})",
        "description": [
            "uBitSize(int x) returns (uint16)",
            "uBitSize computes the smallest c ≥ 0 such that x fits into a c-bit unsigned integer (0 ≤ x < 2c).\n",
            "Example:\n",
            "```\nrequire(uBitSize(10) == 4);\n```\n",
            "```\nrequire(uBitSize(1) == 1);\n```\n",
            "```\nrequire(uBitSize(0) == 0);\n```\n"
        ]
    },
    "<struct>.unpack": {
        "pattern": ".unpack",
        "type": "DataStruct",
        "body": ".unpack()",
        "description": [
            "```\n<struct>.unpack() returns (TypeA /\\*a\\*/, TypeB /\\*b\\\\*/, ...);\n```\n",
            "Unpacks all members stored in the struct.\n",
            "Example:\n",
            "```\nstruct MyStruct {\n\tuint a;\n\tint b;\n\taddress c;\n}\n```",
            "```\nfunction f() pure public {\n\tMyStruct s = MyStruct(1, -1, address(2));\n\t(uint a, int b, address c) = s.unpack();\n}\n```"
        ]
    },
    "<array>.push": {
        "pattern": ".push",
        "type": "array",
        "body": ".push()",
        "description": [
            "```\n<array>.push(Type obj);\n```\n",
            "Appends obj to the array.\n",
            "Example:\n",
            "```\nuint[] arr;\n\narr.push(1);\n\nrequire(!arr.empty());\n```\n"
        ]
    },
    "<array>.empty": {
        "pattern": ".empty",
        "type": "array",
        "body": ".empty()",
        "description": [
            "```\n<array>.empty() returns (bool);\n```\n",
            "Returns status flag whether the array is empty (its length is 0).\n",
            "Example:\n",
            "```\nuint[] arr;\n\nrequire(arr.empty());\n\narr.push();\n\nrequire(!arr.empty());\n```\n"
        ]
    },
    "<bytes>.empty": {
        "pattern": ".empty",
        "type": "bytes",
        "body": ".empty()",
        "description": [
            "```\n<bytes>.empty() returns (bool);\n```\n",
            "Returns status flag whether the bytes is empty (its length is 0)."
        ]
    },
    "<bytes>.length": {
        "pattern": ".length",
        "type": "bytes",
        "body": ".length",
        "description": [
            "```\n<bytes>.length returns (uint)\n```\n",
            "Returns length of the byte array."
        ]
    },
    "<bytes>.toSlice": {
        "pattern": ".toSlice",
        "type": "bytes",
        "body": ".toSlice()",
        "description": [
            "```\n<bytes>.toSlice() returns (TvmSlice);\n```\n",
            "Converts bytes to TvmSlice.\n",
            "Warning: if length of the array is greater than 127\nthen extra bytes are stored in the first reference of the slice. Use \\<TvmSlice\\>.loadRef() to load that extra bytes."
        ]
    },
    "<bytes>.dataSize": {
        "pattern": ".dataSize",
        "type": "bytes",
        "body": ".dataSize(${1:uint n})",
        "description": [
            "```\n\\<bytes>.dataSize(uint n) returns (uint /\\*cells\\*/, uint /\\*bits\\*/, uint /\\*refs\\*/);\n```\n"
        ]
    },
    "<bytes>.dataSizeQ": {
        "pattern": ".dataSizeQ",
        "type": "bytes",
        "body": ".dataSizeQ(${1:uint n})",
        "description": [
            "```\n\\<bytes>.dataSizeQ(uint n) returns (optional(uint /\\*cells\\*/, uint /\\*bits\\*/, uint /\\*refs\\*/));\n```\n"
        ]
    },
    "<bytes>.append": {
        "pattern": ".append",
        "type": "bytes",
        "body": ".append(${1:bytes tail})",
        "description": [
            "```\n<bytes>.append(bytes tail);\n```\n",
            "Modifies the bytes by concatenating tail bytes to the end of the bytes."
        ]
    },
    "<string>.empty": {
        "pattern": ".empty",
        "type": "string",
        "body": ".empty()",
        "description": [
            "```\n<string>.empty() returns (bool);\n```\n",
            "Returns status flag whether the string is empty (its length is 0)."
        ]
    },
    "<string>.byteLength": {
        "pattern": ".byteLength",
        "type": "string",
        "body": ".byteLength()",
        "description": [
            "```\n<string>.byteLength() returns (uint32);\n```\n",
            "Returns byte length of the string data."
        ]
    },
    "<string>.substr": {
        "pattern": ".substr",
        "type": "string",
        "body": ".substr()",
        "description": [
            "```\n<string>.substr(uint from[, uint count]) returns (string);\n```\n",
            "Returns a substring starting from the\nbyte with number from with byte length count. Note: if count is not set, then the new string will be cut from the from byte to the end of the string.\n",
            "Example:\n",
            "```\nstring long = \"0123456789\";\nstring a = long.substr(1, 2); // a = \"12\"\nstring b = long.substr(6); // b = \"6789\"\n```"
        ]
    },
    "<string>.append": {
        "pattern": ".append",
        "type": "string",
        "body": ".append(${1:string tail})",
        "description": [
            "```\n<string>.append(string tail);\n```\n",
            "Appends the tail string to the string."
        ]
    },
    "<string>.find": {
        "pattern": ".find",
        "type": "string",
        "body": ".find(${1|substring,byte('symbol')|})",
        "description": [
            "```\n<string>.find(bytes1 symbol) returns (optional(uint32));\n```\n",
            "```\n<string>.find(string substr) returns (optional(uint32));\n```\n",
            "Looks for symbol (or substring) in the string and returns index of the first (find) occurrence. If there is no such symbol in the string, empty optional is returned."
        ]
    },
    "<string>.findLast": {
        "pattern": ".findLast",
        "type": "string",
        "body": ".findLast(${1|substring,byte('symbol')|})",
        "description": [
            "```\n<string>.findLast(bytes1 symbol) returns (optional(uint32));\n```\n",
            "```\n<string>.findLast(string substr) returns (optional(uint32));\n```\n",
            "Looks for symbol (or substring) in the string and returns index of the last (findLast) occurrence. If there is no such symbol in the string, empty optional is returned."
        ]
    },
    "format": {
        "pattern": "format",
        "type": "global",
        "body": "format(${1: string template}, ${2:TypeA a, TypeB b, ...})",
        "description": [
            "```\nformat(string template, TypeA a, TypeB b, ...) returns (string);\n```\n",
            "Builds a string with arbitrary parameters.\n",
            "Example:\n",
            "```\nformat(\"Hello {}\", 123) \\\\ \"Hello 123\"\n```\n"
        ]
    },
    "stoi": {
        "pattern": "stoi",
        "type": "global",
        "body": "stoi(${1: string inputStr})",
        "description": [
            "```\nstoi(string inputStr) returns (uint /\\*result\\*/, bool /\\*status\\*/);\n```\n",
            "Converts a string into an integer. String is meant to be number in decimal format,\nonly if string starts with '0x' it will be converted from a hexadecimal format. Function returns the integer, that can\nbe converted from uint to int and boolean status,\nwhich is false in case of illegal characters\nin the string. Warning: this function consumes too much gas,\nthat's why it's better not to use it onchain. ",
            "Example:\n",
            "```\n(res, status) = stoi(\"123\");\n```\n"
        ]
    },
    "address": {
        "pattern": "address",
        "type": "global",
        "body": "address(${1: address_value})",
        "description": [
            "Constructs an address of type addr_std with\nzero workchain id and given address value.\n",
            "Example:\n",
            "```\nuint address_value;\naddress addrStd = address(address_value);\n```\n"
        ]
    },
    "address.makeAddrStd": {
        "pattern": "address.makeAddrStd",
        "type": "global",
        "body": "address.makeAddrStd(${1: workchainId}, ${2: address})",
        "description": "Constructs an address of type addr_std\nwith given workchain id wid and value address_value.\n"
    },
    "address.makeAddrNone": {
        "pattern": "address.makeAddrNone",
        "type": "global",
        "body": "address.makeAddrNone()",
        "description": "Constructs an address of type addr_none.\n"
    },
    "address.makeAddrExtern": {
        "pattern": "address.makeAddrExtern",
        "type": "global",
        "body": "address.makeAddrExtern(${1: addrNumber}, ${2: bitCnt})",
        "description": "Constructs an address of type addr_extern with given value with bitCnt bit length.\n"
    },
    "<address>.wid": {
        "pattern": ".wid",
        "type": "address",
        "body": ".wid()",
        "description": [
            "```\n<address>.wid returns (int8);\n```\n",
            "Returns the workchain id of addr_std or addr_var. Throws \"range check error\" exception (error code equal to 5) for another address types."
        ]
    },
    "<address>.value": {
        "pattern": ".value",
        "type": "address",
        "body": ".value()",
        "description": [
            "```\n<address>.value returns (uint);\n```\n",
            "Returns the address value of addr_std or addr_var if addr_var has 256-bit\naddress value. Throws \"range check error\" exception (error code equal to 5) for another address types.\n"
        ]
    },
    "<address>.balance": {
        "pattern": "address(this).balance",
        "type": "address",
        "body": "address(this).balance",
        "description": [
            "```\naddress(this).balance returns (uint128);\n```\n",
            "Returns the balance of this contract in nanotons.\n"
        ]
    },
    "<address>.currencies": {
        "pattern": "address(this).currencies",
        "type": "address",
        "body": "address(this).currencies",
        "description": [
            "```\naddress(this).currencies returns (ExtraCurrencyCollection);\n```\n",
            "Returns currencies on the balance of this contract.\n"
        ]
    },
    "<address>.getType": {
        "pattern": ".getType",
        "type": "address",
        "body": ".getType()",
        "description": [
            "```\n<address>.getType() returns (uint8);\n```\n",
            "Returns type of the address:\n0 - addr_none 1 - addr_extern 2 - addr_std"
        ]
    },
    "<address>.isStdZero": {
        "pattern": ".isStdZero",
        "type": "address",
        "body": ".isStdZero()",
        "description": [
            "```\n<address>.isStdZero() returns (bool);\n```\n",
            "Returns the result of comparison between this address with zero address of type addr_std.\n"
        ]
    },
    "<address>.isStdAddrWithoutAnyCast": {
        "pattern": ".isStdAddrWithoutAnyCast",
        "type": "address",
        "body": ".isStdAddrWithoutAnyCast()",
        "description": [
            "```\n<address>.isStdAddrWithoutAnyCast() returns (bool);\n```\n",
            "Check whether this address is of type addr_std without any cast.\n"
        ]
    },
    "<address>.isExternZero": {
        "pattern": ".isExternZero",
        "type": "address",
        "body": ".isExternZero()",
        "description": [
            "```\n<address>.isExternZero() returns (bool);\n```\n",
            "Returns the result of comparison between this address with zero address of type addr_extern.\n"
        ]
    },
    "<address>.isNone": {
        "pattern": ".isNone",
        "type": "address",
        "body": ".isNone()",
        "description": [
            "```\n<address>.isNone() returns (bool);\n```\n",
            "Check whether this address is of type addr_none.\n"
        ]
    },
    "<address>.unpack": {
        "pattern": ".unpack",
        "type": "address",
        "body": ".unpack()",
        "description": [
            "```\n<address>.unpack() returns (int8 /\\*wid\\*/, uint256 /\\*value\\*/);\n```\n",
            "Parses \\<address> containing a valid MsgAddressInt (addr_std or addr_var), applies rewriting from the anycast (if present) to the same-length prefix of the address, and returns both the workchain wid and the 256-bit address value. If the address value is not 256-bit, or if \\<address> is not a valid serialization of MsgAddressInt, throws a cell deserialization exception.\n",
            "It's wrapper for opcode REWRITESTDADDR.\n",
            "Example:\n",
            "```\n(int8 wid, uint addr) = address(this).unpack();\n```\n"
        ]
    },
    "<address>.transfer": {
        "pattern": ".transfer",
        "type": "address",
        "body": ".transfer(${1:uint128 value}, ${2:bool bounce}, ${3:uint16 flag}, ${4:TvmCell body}, ${5:ExtraCurrencyCollection currencies});",
        "description": [
            "```\n<address>.transfer(",
            "\tuint128 value, ",
            "\tbool bounce,",
            "\tuint16 flag,",
            "\tTvmCell body,",
            "\tExtraCurrencyCollection currencies",
            ");\n```\n",
            "Sends an internal outbound message to defined address. All parameters can be omitted, except value.\n"
        ]
    },
    "<mapping>.min": {
        "pattern": ".min",
        "type": "mapping",
        "body": ".min()",
        "description": [
            "```\n<map>.min() returns (optional(KeyType, ValueType));\n```\n",
            "Computes the minimal key in the mapping and returns an optional value containing that key and the associated value. If mapping is empty, this function returns an empty optional.\n"
        ]
    },
    "<mapping>.max": {
        "pattern": ".max",
        "type": "mapping",
        "body": ".max()",
        "description": [
            "```\n<map>.max() returns (optional(KeyType, ValueType));\n```\n",
            "Computes the maximal key in the mapping and returns an optional value containing that key and the associated value. If mapping is empty, this function returns an empty optional.\n"
        ]
    },
    "<mapping>.next": {
        "pattern": ".next",
        "type": "mapping",
        "body": ".next(${1:KeyType key})",
        "description": [
            "```\n<map>.next(KeyType key) returns (optional(KeyType, ValueType));\n```\n",
            "Computes the maximal key in the mapping that is lexicographically greater than key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.\n",
            "Example:\n",
            "```\nmapping(uint8 => uint) m;\noptional(uint8, uint) = m.next(-1);\n```\n"
        ]
    },
    "<mapping>.prev": {
        "pattern": ".prev",
        "type": "mapping",
        "body": ".prev(${1:KeyType key})",
        "description": [
            "```\n<map>.prev(KeyType key) returns (optional(KeyType, ValueType));\n```\n",
            "Computes the minimal key in the mapping that is lexicographically less than key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.\n",
            "Example:\n",
            "```\nmapping(uint8 => uint) m;\noptional(uint8, uint) = m.prev(123);\n```\n"
        ]
    },
    "<mapping>.nextOrEq": {
        "pattern": ".nextOrEq",
        "type": "mapping",
        "body": ".nextOrEq(${1:KeyType key})",
        "description": [
            "```\n<map>.nextOrEq(KeyType key) returns (optional(KeyType, ValueType));\n```\n",
            "Computes the maximal key in the mapping that is lexicographically greater than or equal to key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.\n"
        ]
    },
    "<mapping>.prevOrEq": {
        "pattern": ".prevOrEq",
        "type": "mapping",
        "body": ".prevOrEq(${1:KeyType key})",
        "description": [
            "```\n<map>.prevOrEq(KeyType key) returns (optional(KeyType, ValueType));\n```\n",
            "Computes the minimal key in the mapping that is lexicographically less than or equal to key and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key. If KeyType is an integer type, argument for this functions can not possibly fit KeyType.\n"
        ]
    },
    "<mapping>.delMin": {
        "pattern": ".delMin",
        "type": "mapping",
        "body": ".delMin()",
        "description": [
            "```\n<map>.delMin() returns (optional(KeyType, ValueType));\n```\n",
            "If mapping is not empty then this function computes the minimal key of the mapping, deletes that key and the associated value from the mapping and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key.\n"
        ]
    },
    "<mapping>.delMax": {
        "pattern": ".delMax",
        "type": "mapping",
        "body": ".delMax()",
        "description": [
            "```\n<map>.delMax() returns (optional(KeyType, ValueType));\n```\n",
            "If mapping is not empty then this function computes the maximum key of the mapping, deletes that key and the associated value from the mapping and returns an optional value containing that key and the associated value. Returns an empty optional if there is no such key.\n"
        ]
    },
    "<mapping>.fetch": {
        "pattern": ".fetch",
        "type": "mapping",
        "body": ".fetch(${1:KeyType key})",
        "description": [
            "```\n<map>.fetch(KeyType key) returns (optional(ValueType));\n```\n",
            "Checks whether key presents in the mapping and returns an optional with the associated value. Returns an empty optional if there is no such key.\n"
        ]
    },
    "<mapping>.exists": {
        "pattern": ".exists",
        "type": "mapping",
        "body": ".exists(${1:KeyType key})",
        "description": [
            "```\n<map>.exists(KeyType key) returns (bool);\n```\n",
            "Returns a status flag whether key presents in the mapping.\n"
        ]
    },
    "<mapping>.empty": {
        "pattern": ".empty",
        "type": "mapping",
        "body": ".empty()",
        "description": [
            "```\n<map>.empty() returns (bool);\n```\n",
            "Returns a status flag whether the mapping is empty.\n"
        ]
    },
    "<mapping>.replace": {
        "pattern": ".replace",
        "type": "mapping",
        "body": ".replace(${1:KeyType key}, ${2:ValueType value})",
        "description": [
            "```\n<map>.replace(KeyType key, ValueType value) returns (bool);\n```\n",
            "Sets the value associated with key only if key presents in the mapping and returns the success flag.\n"
        ]
    },
    "<mapping>.add": {
        "pattern": ".add",
        "type": "mapping",
        "body": ".add(${1:KeyType key}, ${2:ValueType value})",
        "description": [
            "```\n<map>.add(KeyType key, ValueType value) returns (bool);\n```\n",
            "Sets the value associated with key only if key does not present in the mapping.\n"
        ]
    },
    "<mapping>.getSet": {
        "pattern": ".getSet",
        "type": "mapping",
        "body": ".getSet(${1:KeyType key}, ${2:ValueType value})",
        "description": [
            "```\n<map>.getSet(KeyType key, ValueType value) returns (optional(ValueType));\n```\n",
            "Sets the value associated with key, but also returns an optional with the old value associated with the key, if presents. Otherwise, returns an empty optional.\n"
        ]
    },
    "<mapping>.getAdd": {
        "pattern": ".getAdd",
        "type": "mapping",
        "body": ".getAdd(${1:KeyType key}, ${2:ValueType value})",
        "description": [
            "```\n<map>.getAdd(KeyType key, ValueType value) returns (optional(ValueType));\n```\n",
            "Sets the value associated with key, but only if key does not present in the mapping. Returns an optional with the old value without changing the dictionary if that value presents in the mapping, otherwise returns an empty optional.\n"
        ]
    },
    "<mapping>.getReplace": {
        "pattern": ".getReplace",
        "type": "mapping",
        "body": ".getReplace(${1:KeyType key}, ${2:ValueType value})",
        "description": [
            "```\n<map>.getReplace(KeyType key, ValueType value) returns (optional(ValueType));\n```\n",
            "Sets the value associated with key, but only if key presents in the mapping. On success, returns an optional with the old value associated with the key. Otherwise, returns an empty optional.\n"
        ]
    },
    "require": {
        "pattern": "require",
        "type": "global",
        "body": "require(${1:bool condition}, ${2:uint errorCode}, ${3:Type exceptionArgument});",
        "description": [
            "```\nrequire(bool condition, [uint errorCode = 100, [Type exceptionArgument]]);\n```\n",
            "require function can be used to check the condition and throw an exception if the condition is not met. The function takes condition and optional parameters: error code (unsigned integer) and the object of any type.\n",
            "Example:\n",
            "```\nuint a = 5;\n```\n",
            "```\nrequire(a == 6, 101, \"a is not equal to six\");\n```\n"
        ]
    },
    "revert": {
        "pattern": "revert",
        "type": "global",
        "body": "revert(${1:uint errorCode}, ${2:Type exceptionArgument})",
        "description": [
            "```\nrevert(uint errorCode = 100, [Type exceptionArgument]);\n```\n",
            "revert function can be used to throw exceptions. The function takes an optional error code (unsigned integer) and the object of any type.\n",
            "Example:\n",
            "```\nrevert(102, \"We have a some problem\");\n```\n"
        ]
    },
    "receive": {
        "pattern": "receive",
        "type": "global",
        "body": "receive () external {\n\t$0\n}",
        "description": [
            "receive function is called in 2 cases:",
            "1. msg.data (or message body) is empty.",
            "2. msg.data starts with 32-bit zero.",
            "\nThen message body may contain data, for example string with comment."
        ]
    },
    "fallback": {
        "pattern": "fallback",
        "type": "global",
        "body": "fallback () external {\n\t$0\n}",
        "description": [
            "fallback function is called when a body of an inbound internal/external message in such cases:",
            "1. The message contains a function id that the contract doesn't contain.",
            "2. Bit length of message between 1 and 31 (including).",
            "3. Bit length of message equals to zero, but the message contains reference(s)."
        ]
    },
    "onBounce": {
        "pattern": "onBounce",
        "type": "global",
        "body": "onBounce (TvmSlice body) external {\n\t$0\n}",
        "description": [
            "onBounce function is executed when contract receives a bounced inbound internal message. The message is generated by the network if the contract sends an internal message with bounce: true and",
            " * called contract doesn't exist;",
            " * called contract fails at storage/credit/computing phase (not at action phase!).",
            "\nThe message is generated only if the remaining message value is enough for sending one back.\n",
            "body is empty or contains at most 256 data bits of the original message (without references). The function id takes 32 bits and parameters can take at most 224 bits. It depends on the network config. If onBounce function is not defined then the contract does nothing on receiving a bounced inbound internal message.\n",
            "If the onBounce function throws an exception then another bounced messages are not generated."
        ]
    },
    "onTickTock": {
        "pattern": "onTickTock",
        "type": "global",
        "body": "onTickTock (TvmSlice isTock) external {\n\t$0\n}",
        "description": "onTickTock function is executed on tick/tock transaction. That transactions are automatically invoked for certain special accounts. For tick transactions isTock is false, for tock transactions - true.\n"
    },
    "onCodeUpgrade": {
        "pattern": "onCodeUpgrade",
        "type": "global",
        "body": "onCodeUpgrade () private {\n\t$0\n}",
        "description": "onCodeUpgrade function can have arbitrary set of arguments and should be executed after tvm.setcode() function call. In this function tvm.resetStorage() should be called if the set of state variables is changed in the new version of the contract. This function implicitly calls tvm.commit(). Then return from onCodeUpgrade TVM execution is finished with exit code 0.\n"
    },
    "afterSignatureCheck": {
        "pattern": "afterSignatureCheck",
        "type": "global",
        "body": "afterSignatureCheck (TvmSlice body, TvmCell message) private inline returns (TvmSlice){\n\t$0\n}",
        "description": "afterSignatureCheck function is used to define custom replay protection function instead of the default one. Never call tvm.commit() or tvm.accept() in the function because the function can be called before calling constructor.\n"
    },
    "msg.sender": {
        "pattern": "msg.sender",
        "type": "global",
        "body": "msg.sender",
        "description": [
            "```\nmsg.sender returns (address);\n```\n",
            "Returns:\n\n\t* sender of the message for internal message.\n\n\t* address(0) for external message.\n\n\t* address(0) for tick/tock transaction."
        ]
    },
    "msg.value": {
        "pattern": "msg.value",
        "type": "global",
        "body": "msg.value",
        "description": [
            "```\nmsg.value returns (uint128);\n```\n",
            "Returns:\n\tBalance of the inbound message in nanotons for internal message.\n\t0 for external message.\n\tUndefined value for tick/tock transaction."
        ]
    },
    "msg.currencies": {
        "pattern": "msg.currencies",
        "type": "global",
        "body": "msg.currencies",
        "description": [
            "```\nmsg.currencies returns (ExtraCurrencyCollection);\n```\n",
            "Collections of arbitrary currencies contained in the balance of the inbound message."
        ]
    },
    "msg.pubkey": {
        "pattern": "msg.pubkey",
        "type": "global",
        "body": "msg.pubkey()",
        "description": [
            "```\nmsg.pubkey() returns (uint256);\n```\n",
            "Returns sender's public key, obtained from the body of the external inbound message. If the message is not signed, msg.pubkey() returns 0. If the message is signed and message header (pragma AbiHeader) does not contain pubkey then msg.pubkey() is equal to tvm.pubkey()."
        ]
    },
    "msg.isInternal": {
        "pattern": "msg.isInternal",
        "type": "global",
        "body": "msg.isInternal",
        "description": "Returns whether the contract is called by internal message."
    },
    "msg.isExternal": {
        "pattern": "msg.isExternal",
        "type": "global",
        "body": "msg.isExternal",
        "description": "Returns whether the contract is called by external message."
    },
    "msg.isTickTock": {
        "pattern": "msg.isTickTock",
        "type": "global",
        "body": "msg.isTickTock",
        "description": "Returns whether the contract is called by tick/tock transactions."
    },
    "msg.createdAt": {
        "pattern": "msg.createdAt",
        "type": "global",
        "body": "msg.createdAt",
        "description": [
            "```\nmsg.createdAt returns (uint32);\n```\n",
            "Returns a field created_at of the external inbound message.\n"
        ]
    },
    "msg.data": {
        "pattern": "msg.data",
        "type": "global",
        "body": "msg.data",
        "description": [
            "```\nmsg.data returns (TvmSlice);\n```\n",
            "Returns a payload of the inbound message.\n"
        ]
    },
    "tvm.accept": {
        "pattern": "tvm.accept",
        "type": "global",
        "body": "tvm.accept();",
        "description": [
            "```\ntvm.accept();\n```\n",
            "Executes TVM instruction \"ACCEPT\" ([TVM](https://ton.org/tvm.pdf) - A.11.2. - F800). This instruction sets current gas limit to its maximal allowed value. This action is required to process external messages, which bring no value.\n"
        ]
    },
    "tvm.commit": {
        "pattern": "tvm.commit",
        "type": "global",
        "body": "tvm.commit();",
        "description": [
            "```\ntvm.commit();\n```\n",
            "Creates a \"check point\" of the state variables (by copying them from c7 to c4) and register c5. If the contract throws an exception at the computing phase then the state variables and register c5 will roll back to the \"check point\", and the computing phase will be considered \"successful\". If contract doesn't throw an exception, it has no effect.\n"
        ]
    },
    "tvm.rawCommit": {
        "pattern": "tvm.rawCommit",
        "type": "global",
        "body": "tvm.rawCommit();",
        "description": [
            "```\ntvm.rawCommit();\n```\n",
            "Creates a \"check point\" of the state variables but  doesn't copy the state variables from c7 to c4. It's a wrapper for opcode COMMIT. See TVM.\n",
            "Note: Don't use tvm.rawCommit() after tvm.accept() in processing external messages because you don't save from c7 to c4 the hidden state variable timestamp, which is used for replay protection.\n"
        ]
    },
    "tvm.getData": {
        "pattern": "tvm.getData",
        "type": "global",
        "body": "tvm.getData();",
        "description": [
            "```\ntvm.getData() returns (TvmCell);\n```\n",
            "It's an experimental function.\n A dual of the tvm.setData() returning value of c4 register. Getting a raw storage cell is useful when upgrading a new version of contract that introduces an altered data layout.\nManipulation with a raw storage cell requires an understanding of the way the compiler layouts the data. Refer to the description of tvm.setData() below to get more details.\n",
            "Note: state variables and replay protection timestamp stored in data cell have the same values that were before the transaction. See tvm.commit() how to update register c4.\n"
        ]
    },
    "tvm.setData": {
        "pattern": "tvm.setData",
        "type": "global",
        "body": "tvm.setData();",
        "description": [
            "```\ntvm.setData() returns (TvmCell);\n```\n",
            "It's an experimental function.Set cell data to register c4. \n",
            "Note, after returning from a public function all state variable from c7 will copy to c4 and tvm.setData will have no effect. Example of usage of such hint to set c4:\n",
            "```\nTvmCell data = ...;\n```\n",
            "tvm.setData(data); // set register c4\n",
            "tvm.rawCommit();   // save register c4 and c5\n",
            "revert(200);       // throw the exception to terminate the transaction\n",
            "Be careful with the hidden state variable timestamp and think about possibility of replaying external messages.\n"
        ]
    },
    "tvm.log": {
        "pattern": "tvm.log",
        "type": "global",
        "body": "tvm.log(${1:string log});",
        "description": [
            "```\ntvm.log(string log);\n```\n",
            "Dumps log string. This function is wrapper for TVM instructions PRINTSTR (for constant literal strings shorter than 16 symbols) and STRDUMP (for other strings). logtvm is an alias for tvm.log(string).\nNote: For long strings dumps only the first 127 symbols.\n",
            "Example:\n",
            "```\ntvm.log(\"Hello,world!\");\n```\n"
        ]
    },
    "tvm.hexdump": {
        "pattern": "tvm.hexdump",
        "type": "global",
        "body": "tvm.hexdump(${1:T a});",
        "description": [
            "```\ntvm.hexdump(T a);\n```\n",
            "Dumps cell data or integer. Note that for cells this function dumps data only from the first cell. T must be an integer type or TvmCell.\n",
            "Example:\n",
            "```\ntvm.hexdump(123);\\\\Output: 7B\n"
        ]
    },
    "tvm.bindump": {
        "pattern": "tvm.bindump",
        "type": "global",
        "body": "tvm.bindump(${1:T a});",
        "description": [
            "```\ntvm.bindump(T a);\n```\n",
            "Dumps cell data or integer. Note that for cells this function dumps data only from the first cell. T must be an integer type or TvmCell.\n",
            "Example:\n",
            "```\ntvm.bindump(123);\\\\Output: 1111011\n```\n"
        ]
    },
    "tvm.setcode": {
        "pattern": "tvm.setcode",
        "type": "global",
        "body": "tvm.setcode(TvmCell newCode);",
        "description": [
            "```\ntvm.setcode(TvmCell newCode);\n```\n",
            "This command creates an output action that would change this smart contract code to that given by Cell newCode (this change will take effect only after the successful termination of the current run of the smart contract).\n"
        ]
    },
    "tvm.rawConfigParam": {
        "pattern": "tvm.rawConfigParam",
        "type": "global",
        "body": "tvm.rawConfigParam(${1:uint8 paramNumber});",
        "description": [
            "```\ntvm.rawConfigParam(uint8 paramNumber) returns (TvmCell cell, bool status);\n```\n",
            "Executes TVM instruction \"CONFIGPARAM\". This command returns the value of the global configuration parameter with integer index paramNumber. Argument should be an integer literal. Supported paramNumbers: 1, 15, 17, 34.\n"
        ]
    },
    "tvm.rawReserve": {
        "pattern": "tvm.rawReserve",
        "type": "global",
        "body": "tvm.rawReserve(${1:uint value), ${2:uint8 flag});",
        "description": [
            "```\ntvm.rawReserve(uint value, uint8 flag);\ntvm.rawReserve(uint value, ExtraCurrencyCollection currency, uint8 flag);\n```\n",
            "Creates an output action which reserves reserve nanotons. It is roughly equivalent to create an outbound message carrying reserve nanotons to oneself, so that the subsequent output actions would not be able to spend more money than the remainder. It's a wrapper for opcodes \"RAWRESERVE\" and \"RAWRESERVEX\".\n"
        ]
    },
    "tvm.hash": {
        "pattern": "tvm.hash",
        "type": "global",
        "body": "tvm.hash(${1|TvmCell cellTree,string data,bytes data,TvmSlice data|});",
        "description": [
            "```\ntvm.hash(TvmCell cellTree) returns (uint256);\ntvm.hash(string data) returns (uint256);\ntvm.hash(bytes data) returns (uint256);\ntvm.hash(TvmSlice data) returns (uint256);\n```\n",
            "Executes TVM instruction \"HASHCU\" or \"HASHSU\". It computes the representation hash of a given argument and returns it as a 256-bit unsigned integer. For string and bytes it computes hash of the tree of cells, which contains data, but not data itself. See sha256 to count hash of data.\n"
        ]
    },
    "tvm.checkSign": {
        "pattern": "tvm.checkSign",
        "type": "global",
        "body": "tvm.checkSign(${1|uint256 hash\\, uint256 SignHighPart\\, uint256 SignLowPart\\, uint256 pubkey,uint256 hash\\, TvmSlice signature\\, uint256 pubkey,TvmSlice data\\, TvmSlice signature\\, uint256 pubkey|});",
        "description": "returns (bool)\nExecutes TVM instruction \"CHKSIGNU\" for variants 1 and 2. This command checks the Ed25519-signature of a hash using public key pubkey. Signature is represented by two uint256 SignHighPart and SignLowPart in the first variant and by a slice signature in the second variant. In the third variant executes TVM instruction \"CHKSIGNS\". This command checks Ed25519-signature of data using public key pubkey. Signature is represented by a slice signature.\n"
    },
    "tvm.insertPubkey": {
        "pattern": "tvm.insertPubkey",
        "type": "global",
        "body": "tvm.insertPubkey(${1:TvmCell stateInit}, ${2:uint256 pubkey})",
        "description": [
            "```\ntvm.insertPubkey(TvmCell stateInit, uint256 pubkey) returns (TvmCell);\n```\n",
            "Inserts a public key into stateInit data field. If stateInit has wrong format then throws exception.\n"
        ]
    },
    "tvm.buildStateInit": {
        "pattern": "tvm.buildStateInit",
        "type": "global",
        "body": "tvm.buildStateInit(${1|TvmCell code\\, TvmCell data, TvmCell code\\, TvmCell data\\, uint8 splitDepth,{code: TvmCell code\\, data: TvmCell data\\, splitDepth: uint8 splitDepth\\,pubkey: uint256 pubkey\\, contr: contract Contract\\, varInit: {VarName0: varValue0\\, ...}}|})",
        "description": [
            "returns (TvmCell stateInit)\n",
            "Generates a StateInit (TBLKCH - 3.1.7.) from code and data.\n"
        ]
    },
    "tvm.buildEmptyData": {
        "pattern": "tvm.buildEmptyData",
        "type": "global",
        "body": "tvm.buildEmptyData(${1:uint256 publicKey})",
        "description": [
            "```\ntvm.buildEmptyData(uint256 publicKey) returns (TvmCell);\n```\n",
            "Generates a persistent storage of the contract that contains only public key. data can be used to generate StateInit (TBLKCH - 3.1.7.).\n"
        ]
    },
    "tvm.deploy": {
        "pattern": "tvm.deploy",
        "type": "global",
        "body": "tvm.deploy(${1:TvmCell stateInit}, ${2:TvmCell payload}, ${3:uint128 value}, ${4:int8 wid})",
        "description": [
            "```\nreturns(address);\n```\n",
            "Deploys a new contract and returns the address of the deployed contract. This function may be useful if you want to write a universal contract that can deploy any contract.\n"
        ]
    },
    "tvm.code": {
        "pattern": "tvm.code",
        "type": "global",
        "body": "tvm.code()",
        "description": [
            "```\ntvm.code() returns (TvmCell);\n```\n",
            "Returns contract's code.\n"
        ]
    },
    "tvm.codeSalt": {
        "pattern": "tvm.codeSalt",
        "type": "global",
        "body": "tvm.codeSalt(${1:TvmCell code})",
        "description": [
            "```\ntvm.codeSalt(TvmCell code) returns (optional(TvmCell) optSalt);\n```\n",
            "If code contains salt then optSalt contains one. Otherwise, optSalt doesn't contain any value.\n"
        ]
    },
    "tvm.pubkey": {
        "pattern": "tvm.pubkey",
        "type": "global",
        "body": "tvm.pubkey()",
        "description": [
            "```\ntvm.pubkey() returns (uint256);\n```\n",
            "Returns contract's public key, stored in contract data. If key is not set, function returns 0.\n"
        ]
    },
    "tvm.setPubkey": {
        "pattern": "tvm.setPubkey",
        "type": "global",
        "body": "tvm.setPubkey(${1:uint256 newPubkey})",
        "description": [
            "```\ntvm.setPubkey(uint256 newPubkey);\n```\n",
            "Set new contract's public key.\n"
        ]
    },
    "tvm.setCurrentCode": {
        "pattern": "tvm.setCurrentCode",
        "type": "global",
        "body": "tvm.setCurrentCode(${1:TvmCell newCode})",
        "description": [
            "```\ntvm.setCurrentCode(TvmCell newCode);\n```\n",
            "Changes this smart contract current code to that given by Cell newCode. Unlike tvm.setcode() this function changes code of the smart contract only for current TVM execution, but has no effect after termination of the current run of the smart contract.\n"
        ]
    },
    "tvm.resetStorage": {
        "pattern": "tvm.resetStorage",
        "type": "global",
        "body": "tvm.resetStorage()",
        "description": "Resets all state variables to their default values.\n"
    },
    "tvm.functionId": {
        "pattern": "tvm.functionId",
        "type": "global",
        "body": "tvm.functionId(${1:functionName})",
        "description": [
            "```\n// id of public function\ntvm.functionId(functionName) returns (uint32);\n\n// id of public constructor\ntvm.functionId(ContractName) returns (uint32);\n```\n",
            "Returns a function id (uint32) for public/external function or constructor.\n"
        ]
    },
    "tvm.encodeBody": {
        "pattern": "tvm.encodeBody",
        "type": "global",
        "body": "tvm.encodeBody(${1:function},${2:callbackFunction},${3: arg0, arg1, arg2, ...})",
        "description": [
            "```\ntvm.encodeBody(function, arg0, arg1, arg2, ...) returns (TvmCell);\ntvm.encodeBody(function, callbackFunction, arg0, arg1, arg2, ...) returns (TvmCell);\n```\n",
            "Constructs a function call message body that can be used as the payload for <address>.transfer(). If function is responsible then callbackFunction parameter must be set.\n"
        ]
    },
    "tvm.exit": {
        "pattern": "tvm.exit",
        "type": "global",
        "body": "tvm.exit()",
        "description": [
            "```\ntvm.exit();\n```\n",
            "Function are used to save state variables and to quickly terminate execution of the smart contract.\nExit code is equal to zero\n"
        ]
    },
    "tvm.exit1": {
        "pattern": "tvm.exit1",
        "type": "global",
        "body": "tvm.exit1()",
        "description": [
            "```\ntvm.exit1();\n```\n",
            "Function are used to save state variables and to quickly terminate execution of the smart contract.Exit code is equal to one\n"
        ]
    },
    "tvm.buildExtMsg": {
        "pattern": "tvm.buildExtMsg",
        "type": "global",
        "body": "tvm.buildExtMsg({\n\tdest: ${1:address},\n\ttime:${2:uint64},\n\texpire:${3:uint64},\n\tcall:{${4:functionIdentifier[, list_of_function_arguments]}},\n\tsign:${5:bool},\n\tpubkey:${6:optional(uint256)},\n\tabiVer:${7:uint8},\n\tcallbackId:${8:uint32},\n\tonErrorId:${9:uint32},\n\tstateInit:${10:TvmCell},\n\tsignBoxHandle:${11:optional(uint32)}\n\t\\});",
        "description": [
            "```\nreturns (TvmCell);\n```\n",
            "Function should be used only offchain and intended to be used only in debot contracts. Allows creating an external inbound message, that calls the func function of the contract on address destination with specified function arguments.\n"
        ]
    },
    "tvm.buildIntMsg": {
        "pattern": "tvm.buildIntMsg",
        "type": "global",
        "body": "tvm.buildIntMsg({\n\tdest:${1:address},\n\tvalue:${2:uint128},\n\tcall:{${4:function, [callbackFunction, ] arg0, arg1, arg2, ...}},\n\tbounce:${5:bool},\n\tcurrencies:${6:ExtraCurrencyCollection}\n\t\\});",
        "description": [
            "```\nreturns (TvmCell);\n```\n",
            "Function should be used only offchain and intended to be used only in debot contracts. Allows creating an external inbound message, that calls the func function of the contract on address destination with specified function arguments.\n"
        ]
    },
    "tvm.sendrawmsg": {
        "pattern": "tvm.sendrawmsg",
        "type": "global",
        "body": "tvm.sendrawmsg(${1:TvmCell msg}, ${2:uint8 flag});",
        "description": [
            "```\ntvm.sendrawmsg(TvmCell msg, uint8 flag);\n```\n",
            "Send the internal/external message msg with flag. It's wrapper for opcode SENDRAWMSG ([TVM](https://ton.org/tvm.pdf) - A.11.10). Internal message msg can be generated by tvm.buildIntMsg().\n"
        ]
    },
    "math.min": {
        "pattern": "math.min",
        "type": "global",
        "body": "math.min(${1:T a, T b, ...});",
        "description": [
            "```\nmath.min(T a, T b, ...) returns (T);\n```\n",
            "Returns the minimal value of the passed arguments. T should be an integer or fixed point type\n"
        ]
    },
    "math.max": {
        "pattern": "math.max",
        "type": "global",
        "body": "math.max(${1:T a, T b, ...});",
        "description": [
            "```\nmath.max(T a, T b, ...) returns (T);\n```\n",
            "Returns the maximal value of the passed arguments. T should be an integer or fixed point type\n"
        ]
    },
    "math.minmax": {
        "pattern": "math.minmax",
        "type": "global",
        "body": "math.minmax(${1:T a, T b, ...});",
        "description": [
            "```\nmath.minmax(T a, T b) returns (T /\\*min\\*/, T /\\*max\\*/);\n```\n",
            "Returns minimal and maximal values of the passed arguments. T should be an integer or fixed point type\n",
            "Example:\n",
            "```\n(uint a, uint b) = math.minmax(20, 10); // (10, 20)\n```"
        ]
    },
    "math.abs": {
        "pattern": "math.abs",
        "type": "global",
        "body": "math.abs(${1|intM val,fixedMxN val|});",
        "description": [
            "```\nmath.abs(intM val) returns (intM);\nmath.abs(fixedMxN val) returns (fixedMxN);\n```\n",
            "Computes the absolute value of the given integer.\n"
        ]
    },
    "math.modpow2": {
        "pattern": "math.modpow2",
        "type": "global",
        "body": "math.modpow2(${1:uint value}, ${2:uint power});",
        "description": [
            "```\nmath.modpow2(uint value, uint power) returns (uint);\n```\n",
            "Computes the value modulo 2^power. Note that power should be a constant integer.\n"
        ]
    },
    "math.divc": {
        "pattern": "math.divc",
        "type": "global",
        "body": "math.divc(${1:T a}, ${2:T b});",
        "description": [
            "```\nmath.divc(T a, T b) returns (T);\n```\n",
            "Returns result of the division of two integers. T should be an integer or fixed point type. The return value is rounded ceiling\n"
        ]
    },
    "math.divr": {
        "pattern": "math.divr",
        "type": "global",
        "body": "math.divr(${1:T a}, ${2:T b});",
        "description": [
            "```\nmath.divr(T a, T b) returns (T);\n```\n",
            "Returns result of the division of two integers. T should be an integer or fixed point type. The return value is rounded nearest\n"
        ]
    },
    "math.muldiv": {
        "pattern": "math.muldiv",
        "type": "global",
        "body": "math.muldiv(${1:T a}, ${2:T b}, ${3:T c});",
        "description": [
            "```\nmath.muldiv(T a, T b, T c) returns (T);\n```\n",
            "Multiplies two values and then divides the result by a third value. T is integer type. The return value is rounded(floor).\n"
        ]
    },
    "math.muldivr": {
        "pattern": "math.muldivr",
        "type": "global",
        "body": "math.muldivr(${1:T a}, ${2:T b}, ${3:T c});",
        "description": [
            "```\nmath.muldivr(T a, T b, T c) returns (T);\n```\n",
            "Multiplies two values and then divides the result by a third value. T is integer type. The return value is rounded(nearest).\n"
        ]
    },
    "math.muldivc": {
        "pattern": "math.muldivc",
        "type": "global",
        "body": "math.muldivc(${1:T a}, ${2:T b}, ${3:T c});",
        "description": [
            "```\nmath.muldivc(T a, T b, T c) returns (T);\n```\n",
            "Multiplies two values and then divides the result by a third value. T is integer type. The return value is rounded(ceiling).\n"
        ]
    },
    "math.muldivmod": {
        "pattern": "math.muldivmod",
        "type": "global",
        "body": "math.muldivmod(${1:T a}, ${2:T b}, ${3:T c});",
        "description": [
            "```\nmath.muldivmod(T a, T b, T c) (T /\\*result\\*/, T /\\*remainder\\*/);\n```\n",
            "This instruction multiplies first two arguments, divides the result by third argument and returns the result and the remainder. Intermediate result is stored in the 514 bit buffer, and the final result is rounded to the floor.\n"
        ]
    },
    "math.divmod": {
        "pattern": "math.divmod",
        "type": "global",
        "body": "math.divmod(${1:T a}, ${2:T b});",
        "description": [
            "```\nmath.divmod(T a, T b) returns (T /\\*result\\*/, T /\\*remainder\\*/);\n```\n",
            "This instruction divides the first number by the second one and returns the result\nand the remainder. Result is rounded to the floor. T is integer type.\n"
        ]
    },
    "math.sign": {
        "pattern": "math.sign",
        "type": "global",
        "body": "math.sign(${1:int val});",
        "description": [
            "```\nmath.sign(int val) returns (int8);\n```\n",
            "Returns number in case of sign of the argument value val:\n\t-1 if val is negative;\n\t0 if val is zero;\n\t1 if val is positive.\n"
        ]
    },
    "tx.timestamp": {
        "pattern": "tx.timestamp",
        "type": "global",
        "body": "tx.timestamp",
        "description": [
            "```\ntx.timestamp returns (uint64);\n```\n",
            "Returns the logical time of the current transaction.\n"
        ]
    },
    "block.timestamp": {
        "pattern": "block.timestamp",
        "type": "global",
        "body": "block.timestamp",
        "description": [
            "```\nblock.timestamp returns (uint64);\n```\n",
            "Returns the starting logical time of the current block."
        ]
    },
    "rnd.next": {
        "pattern": "rnd.next",
        "type": "global",
        "body": "rnd.next(${1:[Type limit]})",
        "description": [
            "```\nrnd.next([Type limit]) returns (Type);\n```\n",
            "Generates a new pseudo-random number.\n",
            "1. Returns uint256 number.",
            "2. If the first argument limit > 0 then function returns the value in the range 0..limit-1. Else if limit < 0 then the returned value lies in range limit..-1. Else if limit == 0 then it returns 0.\n",
            "Example:\n",
            "```\n uint256 r0 = rnd.next(); // 0..2^256-1\n```",
            "```\n uint8 r1 = rnd.next(100);  // 0..991\n```",
            "```\nint8 r2 = rnd.next(int8(100));  // 0..991\n```",
            "```\nint8 r3 = rnd.next(int8(-100)); // -100..-11\n```\n"
        ]
    },
    "rnd.getSeed": {
        "pattern": "rnd.getSeed",
        "type": "global",
        "body": "rnd.getSeed()",
        "description": [
            "```\nrnd.getSeed() returns (uint256);\n```\n",
            "Returns the current random seed.\n"
        ]
    },
    "rnd.setSeed": {
        "pattern": "rnd.setSeed",
        "type": "global",
        "body": "rnd.setSeed()",
        "description": [
            "```\nrnd.setSeed(${1:uint256 x});\n```\n",
            "Sets the random seed to x.\n"
        ]
    },
    "rnd.shuffle": {
        "pattern": "rnd.shuffle",
        "type": "global",
        "body": "rnd.shuffle(${1:uint someNumber(optional)})",
        "description": [
            "Randomizes the random seed.\n",
            "1. Mixes the random seed and someNumber\nrnd.shuffle(uint someNumber);",
            "2. Mixes the random seed and the logical time of the current transaction."
        ]
    },
    "selfdestruct": {
        "pattern": "selfdestruct",
        "type": "global",
        "body": "selfdestruct(${1:address dest_addr})",
        "description": [
            "```\nselfdestruct(address dest_addr);\n```\n",
            "Creates and sends the message that carries all the remaining balance of the current smart contract and destroys the current account.\n"
        ]
    },
    "sha256": {
        "pattern": "sha256",
        "type": "global",
        "body": "sha256(${1|TvmSlice slice, bytes b, string str|})",
        "description": [
            "sha256(TvmSlice slice) returns (uint256)\n",
            "sha256(bytes b) returns (uint256)\n",
            "sha256(string str) returns (uint256)\n",
            "1. Compute the SHA-256 hash. If the bit length of slice is not divisible by eight, throws a cell underflow exception. References of slice are not used to compute the hash. Only data bits located in the root cell of slice are used.  ",
            "2. Compute the SHA-256 hash only for the first 127 bytes. If bytes.length > 127 then b[128], b[129], b[130] ... elements are ignored.",
            "3. Same as for bytes: only the first 127 nbytes are taken into account.\n"
        ]
    },
    "gasToValue": {
        "pattern": "gasToValue",
        "type": "global",
        "body": "gasToValue(${1:uint128 gas}, ${2:int8 wid})",
        "description": [
            "gasToValue(uint128 gas, int8 wid) returns (uint128 value)\n",
            "Returns worth of gas in workchain wid. Throws an exception if wid doesn't equal 0 and -1.\n"
        ]
    },
    "valueToGas": {
        "pattern": "valueToGas",
        "type": "global",
        "body": "valueToGas(${1:uint128 value}, ${2:int8 wid})",
        "description": [
            "gasToValue(uint128 value, int8 wid) returns (uint128 gas)\n",
            "Returns how much gas could be bought on value nanotons in workchain wid. Throws an exception if wid doesn't equal 0 and -1.\n"
        ]
    },
    "constant": {
        "pattern": "constant",
        "type": "global",
        "body": "constant ${1:name} = ${0:value};",
        "description": [
            "```\nuint constant cost = 100;\n```\n",
            "For constant variables, the value has to be a constant at compile time and this value is substituted where the variable is used. The value has to be assigned where the variable is declared.\n"
        ]
    },
    "static": {
        "pattern": "static",
        "type": "global",
        "body": "static ${0:name};",
        "description": [
            "Static state variables are used in generation of the contract origin state. Such variables can be set while deploying contract from contract (onchain) or by tvm-linker (offchain).\n",
            "Example:\n",
            "```\nuint static a; //ok\n```",
            "```\nuint static b = 123; // error\n```"
        ]
    },
    "nano": {
        "pattern": "nano",
        "type": "global",
        "body": "nano",
        "description": [
            "1 nano = 0.000000001 ton or 1e-9ton\n"
        ]
    },
    "nanoton": {
        "pattern": "nanoton",
        "type": "global",
        "body": "nanoton",
        "description": [
            "1 nanoton == 0.000000001 ton or 1e-9ton\n"
        ]
    },
    "nTon": {
        "pattern": "nTon",
        "type": "global",
        "body": "nTon",
        "description": [
            "1 nTon == 0.000000001 ton or 1e-9ton\n"
        ]
    },
    "Ton": {
        "pattern": "Ton",
        "type": "global",
        "body": "Ton",
        "description": [
            "1 Ton == 1e9 nanoton\n"
        ]
    },
    "micro": {
        "pattern": "micro",
        "type": "global",
        "body": "micro",
        "description": [
            "1 Ton == 1e-6 ton\n"
        ]
    },
    "microton": {
        "pattern": "microton",
        "type": "global",
        "body": "microton",
        "description": [
            "1 microton == 1e-6 ton\n"
        ]
    },
    "milli": {
        "pattern": "milli",
        "type": "global",
        "body": "milli",
        "description": [
            "1 milli == 1e-3 ton\n"
        ]
    },
    "milliton": {
        "pattern": "milliton",
        "type": "global",
        "body": "milliton",
        "description": [
            "1 milliton == 1e-3 ton\n"
        ]
    },
    "kiloton": {
        "pattern": "kiloton",
        "type": "global",
        "body": "kiloton",
        "description": [
            "1 kiloton == 1e3 ton\n"
        ]
    },
    "kTon": {
        "pattern": "kTon",
        "type": "global",
        "body": "kTon",
        "description": [
            "1 kTon == 1e3 ton\n"
        ]
    },
    "megaton": {
        "pattern": "megaton",
        "type": "global",
        "body": "megaton",
        "description": [
            "1 kTon == 1e6 ton\n"
        ]
    },
    "MTon": {
        "pattern": "MTon",
        "type": "global",
        "body": "MTon",
        "description": [
            "1 MTon == 1e6 ton\n"
        ]
    },
    "gigaton": {
        "pattern": "gigaton",
        "type": "global",
        "body": "gigaton",
        "description": [
            "1 gigaton == 1e6 gigaton\n"
        ]
    },
    "GTon": {
        "pattern": "GTon",
        "type": "global",
        "body": "GTon",
        "description": [
            "1 GTon == 1e6 GTon\n"
        ]
    },
    "<optional(Type)>.set": {
        "pattern": ".set",
        "type": "optional",
        "body": ".set(${1:Type value})",
        "description": [
            "```\n<optional(Type)>.set(Type value);\n```\n",
            "Replaces the content of the optional with the contents of other."
        ]
    },
    "<optional(Type)>.reset": {
        "pattern": ".reset",
        "type": "optional",
        "body": ".reset()",
        "description": [
            "```\n<optional(Type)>.reset();\n```\n",
            "Deletes the content of the optional."
        ]
    },
    "<TvmSlice>.decode": {
        "pattern": ".decode",
        "type": "optional",
        "body": ".decode(${1:TypeA}, ${2:TypeB} ...)",
        "description": [
            "```\n<TvmSlice>.decode(TypeA, TypeB, ...) returns (TypeA /\\*a\\*/, TypeB /\\*b\\*/, ...);\n```\n",
            "Supported types: `uintN`, `intN`, `bytesN`, `bool`, `ufixedMxN`, `fixedMxN`, `address`, `contract`, `TvmCell`, `bytes`, `string`, `mapping`, `ExtraCurrencyCollection`, `array`, `optional` and `struct`\n",
            "Example:\n",
            "```\nTvmSlice slice = ...;\n```\n",
            "```\n(uint8 a, uint16 b) = slice.decode(uint8, uint16);\n```\n",
            "```\n(uint16 num0, uint32 num1, address addr) = slice.decode(uint16, uint32, address);\n```\n"
        ]
    }
}