const CollectionContract = {
    abi: {
        "ABI version": 2,
        "version": "2.2",
        "header": [
            "pubkey",
            "time",
            "expire"
        ],
        "functions": [
            {
                "name": "constructor",
                "inputs": [
                    {
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "name": "manager",
                        "type": "address"
                    },
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "name": "limit",
                        "type": "uint64"
                    },
                    {
                        "name": "tokenCode",
                        "type": "cell"
                    },
                    {
                        "name": "creatorFees",
                        "type": "uint32"
                    },
                    {
                        "name": "mintCost",
                        "type": "uint128"
                    },
                    {
                        "name": "level1",
                        "type": "string[]"
                    },
                    {
                        "name": "level2",
                        "type": "string[]"
                    },
                    {
                        "name": "level3",
                        "type": "string[]"
                    },
                    {
                        "name": "level4",
                        "type": "string[]"
                    },
                    {
                        "name": "level5",
                        "type": "string[]"
                    },
                    {
                        "name": "hash",
                        "type": "string"
                    },
                    {
                        "name": "startTime",
                        "type": "uint32"
                    }
                ],
                "outputs": []
            },
            {
                "name": "mint",
                "inputs": [
                    {
                        "name": "mintId",
                        "type": "uint32"
                    },
                    {
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "name": "id1",
                        "type": "uint8"
                    },
                    {
                        "name": "id2",
                        "type": "uint8"
                    },
                    {
                        "name": "id3",
                        "type": "uint8"
                    },
                    {
                        "name": "id4",
                        "type": "uint8"
                    },
                    {
                        "name": "id5",
                        "type": "uint8"
                    }
                ],
                "outputs": []
            },
            {
                "name": "mintToken",
                "inputs": [],
                "outputs": []
            },
            {
                "name": "getTokenAddress",
                "inputs": [
                    {
                        "name": "id1",
                        "type": "uint8"
                    },
                    {
                        "name": "id2",
                        "type": "uint8"
                    },
                    {
                        "name": "id3",
                        "type": "uint8"
                    },
                    {
                        "name": "id4",
                        "type": "uint8"
                    },
                    {
                        "name": "id5",
                        "type": "uint8"
                    }
                ],
                "outputs": [
                    {
                        "name": "addr",
                        "type": "address"
                    }
                ]
            },
            {
                "name": "getManager",
                "inputs": [],
                "outputs": [
                    {
                        "name": "value0",
                        "type": "address"
                    }
                ]
            },
            {
                "name": "changeManager",
                "inputs": [
                    {
                        "name": "newManager",
                        "type": "address"
                    }
                ],
                "outputs": []
            },
            {
                "name": "getInfo",
                "id": "0xA",
                "inputs": [],
                "outputs": [
                    {
                        "name": "id",
                        "type": "uint64"
                    },
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "name": "totalSupply",
                        "type": "uint64"
                    },
                    {
                        "name": "limit",
                        "type": "uint64"
                    },
                    {
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "name": "creatorFees",
                        "type": "uint32"
                    },
                    {
                        "name": "hash",
                        "type": "string"
                    },
                    {
                        "name": "mintCost",
                        "type": "uint128"
                    },
                    {
                        "name": "startTime",
                        "type": "uint32"
                    }
                ]
            },
            {
                "name": "getLevels",
                "inputs": [],
                "outputs": [
                    {
                        "name": "level1",
                        "type": "string[]"
                    },
                    {
                        "name": "level2",
                        "type": "string[]"
                    },
                    {
                        "name": "level3",
                        "type": "string[]"
                    },
                    {
                        "name": "level4",
                        "type": "string[]"
                    },
                    {
                        "name": "level5",
                        "type": "string[]"
                    }
                ]
            },
            {
                "name": "withdraw",
                "inputs": [
                    {
                        "name": "addr",
                        "type": "address"
                    },
                    {
                        "name": "value",
                        "type": "uint128"
                    },
                    {
                        "name": "bounce",
                        "type": "bool"
                    }
                ],
                "outputs": []
            }
        ],
        "data": [
            {
                "key": 1,
                "name": "_root",
                "type": "address"
            },
            {
                "key": 2,
                "name": "_id",
                "type": "uint64"
            }
        ],
        "events": [
            {
                "name": "TK_MT_nifi_col1_1",
                "inputs": [
                    {
                        "name": "collectionId",
                        "type": "uint64"
                    },
                    {
                        "name": "index",
                        "type": "uint32"
                    },
                    {
                        "name": "id1",
                        "type": "uint8"
                    },
                    {
                        "name": "id2",
                        "type": "uint8"
                    },
                    {
                        "name": "id3",
                        "type": "uint8"
                    },
                    {
                        "name": "id4",
                        "type": "uint8"
                    },
                    {
                        "name": "id5",
                        "type": "uint8"
                    }
                ],
                "outputs": []
            },
            {
                "name": "SRC_PY_nifi_col1_1",
                "inputs": [
                    {
                        "name": "collectionId",
                        "type": "uint64"
                    },
                    {
                        "name": "futureId",
                        "type": "uint32"
                    },
                    {
                        "name": "value",
                        "type": "uint128"
                    },
                    {
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "outputs": []
            }
        ],
        "fields": [
            {
                "name": "_pubkey",
                "type": "uint256"
            },
            {
                "name": "_timestamp",
                "type": "uint64"
            },
            {
                "name": "_constructorFlag",
                "type": "bool"
            },
            {
                "name": "_root",
                "type": "address"
            },
            {
                "name": "_id",
                "type": "uint64"
            },
            {
                "name": "_creator",
                "type": "address"
            },
            {
                "name": "_manager",
                "type": "address"
            },
            {
                "name": "_name",
                "type": "string"
            },
            {
                "name": "_symbol",
                "type": "string"
            },
            {
                "name": "_tokenCode",
                "type": "cell"
            },
            {
                "name": "_totalSupply",
                "type": "uint32"
            },
            {
                "name": "_ready2Mint",
                "type": "uint32"
            },
            {
                "name": "_limit",
                "type": "uint64"
            },
            {
                "name": "_creatorFees",
                "type": "uint32"
            },
            {
                "name": "_mintCost",
                "type": "uint128"
            },
            {
                "name": "_level1",
                "type": "string[]"
            },
            {
                "name": "_level2",
                "type": "string[]"
            },
            {
                "name": "_level3",
                "type": "string[]"
            },
            {
                "name": "_level4",
                "type": "string[]"
            },
            {
                "name": "_level5",
                "type": "string[]"
            },
            {
                "name": "_hash",
                "type": "string"
            },
            {
                "name": "_startTime",
                "type": "uint32"
            }
        ]
    },
    tvc: "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",
    code: "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",
    codeHash: "da726217a00f5b48ca0cb079bca2e9fde10021b379e3758401cf86f0aab94f29",
};
module.exports = { CollectionContract };