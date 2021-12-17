const TokenContract = {
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
                        "name": "certCode",
                        "type": "cell"
                    }
                ],
                "outputs": []
            },
            {
                "name": "changeOwner",
                "inputs": [
                    {
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "outputs": []
            },
            {
                "name": "isExist",
                "inputs": [
                    {
                        "name": "_answer_id",
                        "type": "uint32"
                    }
                ],
                "outputs": [
                    {
                        "name": "value0",
                        "type": "bool"
                    }
                ]
            },
            {
                "name": "getOwner",
                "inputs": [
                    {
                        "name": "_answer_id",
                        "type": "uint32"
                    }
                ],
                "outputs": [
                    {
                        "name": "value0",
                        "type": "address"
                    }
                ]
            },
            {
                "name": "getInfo",
                "inputs": [
                    {
                        "name": "_answer_id",
                        "type": "uint32"
                    }
                ],
                "outputs": [
                    {
                        "name": "value0",
                        "type": "address"
                    },
                    {
                        "name": "value1",
                        "type": "address"
                    },
                    {
                        "name": "value2",
                        "type": "uint8[]"
                    }
                ]
            }
        ],
        "data": [
            {
                "key": 1,
                "name": "_images",
                "type": "uint8[]"
            }
        ],
        "events": []
    },
    tvc: "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",
    code: "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",
    codeHash: "31aa032ca6d843b56cc709f9017f0ebb6447bc8335eeaf6b72f27f1f33e99522",
};
module.exports = { TokenContract };