const NFTCollectionContract = {
    abi: {
        "ABI version": 2,
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
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "name": "supply",
                        "type": "uint32"
                    },
                    {
                        "name": "imageCode",
                        "type": "cell"
                    },
                    {
                        "name": "tokenCode",
                        "type": "cell"
                    },
                    {
                        "name": "certCode",
                        "type": "cell"
                    }
                ],
                "outputs": []
            },
            {
                "name": "mint",
                "inputs": [
                    {
                        "name": "imgIds",
                        "type": "uint8[]"
                    }
                ],
                "outputs": []
            },
            {
                "name": "onExist",
                "inputs": [
                    {
                        "name": "value0",
                        "type": "bool"
                    }
                ],
                "outputs": []
            },
            {
                "name": "removeQuery",
                "inputs": [],
                "outputs": []
            },
            {
                "name": "undoMint",
                "inputs": [
                    {
                        "name": "futureAddress",
                        "type": "address"
                    },
                    {
                        "name": "imgIds",
                        "type": "uint8[]"
                    }
                ],
                "outputs": []
            },
            {
                "name": "doMint",
                "inputs": [
                    {
                        "name": "futureAddress",
                        "type": "address"
                    },
                    {
                        "name": "imgIds",
                        "type": "uint8[]"
                    },
                    {
                        "name": "price",
                        "type": "uint128"
                    }
                ],
                "outputs": []
            },
            {
                "name": "addLevel",
                "inputs": [
                    {
                        "name": "imgCount",
                        "type": "uint8"
                    }
                ],
                "outputs": []
            },
            {
                "name": "levelDeploy",
                "inputs": [
                    {
                        "name": "id",
                        "type": "uint8"
                    },
                    {
                        "name": "count",
                        "type": "uint8"
                    },
                    {
                        "name": "levelId",
                        "type": "uint8"
                    }
                ],
                "outputs": []
            },
            {
                "name": "getImageAddress",
                "inputs": [
                    {
                        "name": "levelId",
                        "type": "uint8"
                    },
                    {
                        "name": "id",
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
                "name": "setComplete",
                "inputs": [],
                "outputs": []
            },
            {
                "name": "getInfo",
                "inputs": [],
                "outputs": [
                    {
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "name": "supply",
                        "type": "uint32"
                    },
                    {
                        "name": "minted",
                        "type": "uint32"
                    },
                    {
                        "name": "levelCount",
                        "type": "uint8"
                    },
                    {
                        "name": "firstLvlImgCount",
                        "type": "uint32"
                    },
                    {
                        "name": "complete",
                        "type": "bool"
                    }
                ]
            },
            {
                "name": "getTokenAddress",
                "inputs": [
                    {
                        "name": "imgIds",
                        "type": "uint8[]"
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
                "name": "getCodes",
                "inputs": [],
                "outputs": [
                    {
                        "name": "certCode",
                        "type": "cell"
                    },
                    {
                        "name": "imageCode",
                        "type": "cell"
                    }
                ]
            }
        ],
        "data": [],
        "events": []
    },
    tvc: "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",
    code: "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",
    codeHash: "bd89897b07ef531eda42aa0c80965eff4d57302a5759343e3e46cadd2eed9be1",
};
module.exports = { NFTCollectionContract };