const CollectionRootContract = {
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
                        "name": "manager",
                        "type": "address"
                    },
                    {
                        "name": "creationMinValue",
                        "type": "uint128"
                    },
                    {
                        "name": "creationFee",
                        "type": "uint128"
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
                        "name": "collectionCode",
                        "type": "cell"
                    },
                    {
                        "name": "colTokenCode",
                        "type": "cell"
                    }
                ],
                "outputs": []
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
            },
            {
                "name": "createCollection",
                "inputs": [
                    {
                        "name": "creator",
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
                "outputs": [
                    {
                        "name": "addr",
                        "type": "address"
                    }
                ]
            },
            {
                "name": "getCollectionAddress",
                "inputs": [
                    {
                        "name": "id",
                        "type": "uint64"
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
                "name": "getTokenAddress",
                "inputs": [
                    {
                        "name": "col",
                        "type": "uint64"
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
                "outputs": [
                    {
                        "name": "addr",
                        "type": "address"
                    }
                ]
            }
        ],
        "data": [],
        "events": [
            {
                "name": "SRC_CT_nifi_col1_1",
                "inputs": [
                    {
                        "name": "id",
                        "type": "uint64"
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
                "name": "_manager",
                "type": "address"
            },
            {
                "name": "_creationFee",
                "type": "uint128"
            },
            {
                "name": "_creationMinValue",
                "type": "uint128"
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
                "name": "_colTokenCode",
                "type": "cell"
            },
            {
                "name": "_collectionCode",
                "type": "cell"
            },
            {
                "name": "_totalSupply",
                "type": "uint64"
            }
        ]
    },
    tvc: "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",
    code: "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",
    codeHash: "cd6529747603f16d16d26befe2346a17d8ef319126bad11a735903259ae99b9c",
};
module.exports = { CollectionRootContract };