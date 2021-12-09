const ImageContract = {
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
                        "name": "levelImageCount",
                        "type": "uint8"
                    }
                ],
                "outputs": []
            },
            {
                "name": "setImageProps",
                "inputs": [
                    {
                        "name": "chunks",
                        "type": "uint8"
                    },
                    {
                        "name": "price",
                        "type": "uint64"
                    },
                    {
                        "name": "nextLevelImageCount",
                        "type": "uint8"
                    },
                    {
                        "name": "name",
                        "type": "bytes"
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
                "name": "getInfo",
                "inputs": [],
                "outputs": [
                    {
                        "name": "root",
                        "type": "address"
                    },
                    {
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "name": "chunks",
                        "type": "uint8"
                    },
                    {
                        "name": "price",
                        "type": "uint64"
                    },
                    {
                        "name": "levelImageCount",
                        "type": "uint8"
                    },
                    {
                        "name": "nextLevelImageCount",
                        "type": "uint8"
                    },
                    {
                        "name": "complete",
                        "type": "bool"
                    },
                    {
                        "name": "name",
                        "type": "bytes"
                    }
                ]
            },
            {
                "name": "getContent",
                "inputs": [],
                "outputs": [
                    {
                        "name": "content",
                        "type": "map(uint8,bytes)"
                    }
                ]
            },
            {
                "name": "fillContent",
                "inputs": [
                    {
                        "name": "chunkNumber",
                        "type": "uint8"
                    },
                    {
                        "name": "part",
                        "type": "bytes"
                    }
                ],
                "outputs": []
            },
            {
                "name": "processMint",
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
                "name": "_complete",
                "inputs": [],
                "outputs": [
                    {
                        "name": "_complete",
                        "type": "bool"
                    }
                ]
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
                "name": "_level",
                "type": "uint8"
            },
            {
                "key": 3,
                "name": "_id",
                "type": "uint8"
            }
        ],
        "events": []
    },
    tvc: "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",
    code: "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",
    codeHash: "fdcf54d87499bc5409ab0ada5aeabb598c79e6dee55bd675218de7e8f9809216",
};
module.exports = { ImageContract };