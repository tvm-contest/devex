"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataAbi = void 0;
exports.dataAbi = {
    "ABI version": 2,
    "version": "2.2",
    "header": ["time", "expire"],
    "functions": [
        {
            "name": "constructor",
            "inputs": [
                { "name": "addrOwner", "type": "address" },
                { "name": "codeIndex", "type": "cell" },
                { "name": "rarityType", "type": "string" }
            ],
            "outputs": []
        },
        {
            "name": "transferOwnership",
            "inputs": [
                { "name": "addrTo", "type": "address" }
            ],
            "outputs": []
        },
        {
            "name": "getInfo",
            "inputs": [],
            "outputs": [
                { "name": "addrRoot", "type": "address" },
                { "name": "addrOwner", "type": "address" },
                { "name": "addrData", "type": "address" }
            ]
        },
        {
            "name": "getOwner",
            "inputs": [],
            "outputs": [
                { "name": "addrOwner", "type": "address" }
            ]
        },
        {
            "name": "resolveCodeHashIndex",
            "inputs": [
                { "name": "addrRoot", "type": "address" },
                { "name": "addrOwner", "type": "address" }
            ],
            "outputs": [
                { "name": "codeHashIndex", "type": "uint256" }
            ]
        },
        {
            "name": "resolveIndex",
            "inputs": [
                { "name": "addrRoot", "type": "address" },
                { "name": "addrData", "type": "address" },
                { "name": "addrOwner", "type": "address" }
            ],
            "outputs": [
                { "name": "addrIndex", "type": "address" }
            ]
        }
    ],
    "data": [
        { "key": 1, "name": "_id", "type": "uint256" }
    ],
    "events": [],
    "fields": [
        { "name": "_pubkey", "type": "uint256" },
        { "name": "_timestamp", "type": "uint64" },
        { "name": "_constructorFlag", "type": "bool" },
        { "name": "_codeIndex", "type": "cell" },
        { "name": "_addrRoot", "type": "address" },
        { "name": "_addrOwner", "type": "address" },
        { "name": "_addrAuthor", "type": "address" },
        { "name": "_id", "type": "uint256" },
        { "name": "_rarityType", "type": "string" },
        { "name": "abiString", "type": "string" }
    ]
};
//# sourceMappingURL=data-abi.js.map