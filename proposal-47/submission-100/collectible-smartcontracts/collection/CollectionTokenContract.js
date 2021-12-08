const CollectionTokenContract = {
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
                        "name": "owner",
                        "type": "address"
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
                        "name": "index",
                        "type": "uint32"
                    }
                ],
                "outputs": []
            },
            {
                "name": "changeOwner",
                "inputs": [
                    {
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "outputs": []
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
                        "name": "collection",
                        "type": "address"
                    },
                    {
                        "name": "collectionId",
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
                ]
            },
            {
                "name": "receiveTradeInfo",
                "inputs": [
                    {
                        "name": "answerId",
                        "type": "uint32"
                    }
                ],
                "outputs": [
                    {
                        "name": "owner",
                        "type": "address"
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
                        "name": "manager",
                        "type": "address"
                    },
                    {
                        "name": "managerUnlockTime",
                        "type": "uint32"
                    }
                ]
            },
            {
                "name": "getTradeInfo",
                "inputs": [],
                "outputs": [
                    {
                        "name": "owner",
                        "type": "address"
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
                        "name": "manager",
                        "type": "address"
                    },
                    {
                        "name": "managerUnlockTime",
                        "type": "uint32"
                    }
                ]
            },
            {
                "name": "lockManager",
                "inputs": [
                    {
                        "name": "manager",
                        "type": "address"
                    },
                    {
                        "name": "unlockTime",
                        "type": "uint32"
                    }
                ],
                "outputs": []
            },
            {
                "name": "unlock",
                "inputs": [],
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
                "name": "_collection",
                "type": "address"
            },
            {
                "key": 3,
                "name": "_collectionId",
                "type": "uint64"
            },
            {
                "key": 4,
                "name": "_id1",
                "type": "uint8"
            },
            {
                "key": 5,
                "name": "_id2",
                "type": "uint8"
            },
            {
                "key": 6,
                "name": "_id3",
                "type": "uint8"
            },
            {
                "key": 7,
                "name": "_id4",
                "type": "uint8"
            },
            {
                "key": 8,
                "name": "_id5",
                "type": "uint8"
            }
        ],
        "events": [
            {
                "name": "TK_CO_nifi_col1_1",
                "inputs": [
                    {
                        "name": "_collectionId",
                        "type": "uint64"
                    },
                    {
                        "name": "index",
                        "type": "uint32"
                    },
                    {
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "outputs": []
            },
            {
                "name": "TK_MG_nifi_col1_1",
                "inputs": [
                    {
                        "name": "_collectionId",
                        "type": "uint64"
                    },
                    {
                        "name": "index",
                        "type": "uint32"
                    },
                    {
                        "name": "newManager",
                        "type": "address"
                    },
                    {
                        "name": "expirationTime",
                        "type": "uint32"
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
                "name": "_collection",
                "type": "address"
            },
            {
                "name": "_collectionId",
                "type": "uint64"
            },
            {
                "name": "_id1",
                "type": "uint8"
            },
            {
                "name": "_id2",
                "type": "uint8"
            },
            {
                "name": "_id3",
                "type": "uint8"
            },
            {
                "name": "_id4",
                "type": "uint8"
            },
            {
                "name": "_id5",
                "type": "uint8"
            },
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_manager",
                "type": "address"
            },
            {
                "name": "_managerUnlockTime",
                "type": "uint32"
            },
            {
                "name": "_creator",
                "type": "address"
            },
            {
                "name": "_creatorFees",
                "type": "uint32"
            },
            {
                "name": "_index",
                "type": "uint32"
            }
        ]
    },
    tvc: "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",
    code: "te6ccgECKAEAB0sABCSK7VMg4wMgwP/jAiDA/uMC8gslBAEnAQACAvztRNDXScMB+GaNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4aSHbPNMAAY4agQIA1xgg+QEB0wABlNP/AwGTAvhC4vkQ8qiV0wAB8nri0z8B+EMhufK0IPgjgQPoqIIIG3dAoLnytPhj0x8B+CO88rnTHwEcAwEI2zzyPAUDeu1E0NdJwwH4ZiLQ0wP6QDD4aak4APhEf29xggiYloBvcm1vc3BvdPhk3CHHAOMCIdcNH/K8IeMDAds88jwkJAUCKCCCEDqdpFK74wIgghBv2nP+u+MCEAYDPCCCEEVkPGi64wIgghBcxOa2uuMCIIIQb9pz/rrjAg0KBwOOMPhG8uBM+EJu4wDTH/hEWG91+GTR2zwlji0n0NMB+kAwMcjPhyDOcc8LYV5AyM+Tv2nP+s5VMMjOyx9ZyM7LH83Nzclw+wAjCQgBkI5B+EQgbxMhbxL4SVUCbxHIcs9AygBzz0DOAfoC9ABxzwtpXkDI+ERvFc8LH85VMMjOyx9ZyM7LH83Nzcn4RG8U+wDi4wDyACEBIPhEcG9ycG9xgEBvdPhk2zwiAyQw+Eby4Ez4Qm7jANHbPNs88gAjCxkBKoj4SfhTxwX4I/hUubDy6Gf4AHD4dAwAPE1ldGhvZCBmb3IgbG9ja2VkIG1hbmFnZXIgb25seQNKMPhG8uBM+EJu4wD6QZXU0dD6QN/XDR+V1NHQ0x/f0ds82zzyACMOGQTCiPhJ+FLHBfgj+FS+sPhJ+FPHBfgj+FS5sLHy6GiIIvpCbxPXC//DAPLoaoj4IyK58uhp+AAB+HMg+HT4U/hX+EzbPMjPhyDOcc8LYVUwyM+QA/airss/yx/Oyx/NyXD7ABYaDxUAIkludmFsaWQgbG9jayB0aW1lBFAgghAUewjIuuMCIIIQH6BsxLrjAiCCECF7Mwi64wIgghA6naRSuuMCIBcTEQOUMPhG8uBM+EJu4wDR2zwojjEq0NMB+kAwMcjPhyDOcc8LYV5wyM+S6naRSs5VYMjOyz/LB8sHywfLB8sHzc3JcPsAkl8I4uMA8gAjEiEAIPhK+Ev4TPhN+E74T/hQ+FEDNjD4RvLgTPhCbuMA+kGV1NHQ+kDf0ds82zzyACMUGQOkiPhJ+FLHBfgj+FS+sPhJ+FPHBfgj+FS5sLHy6GiIIfpCbxPXC//DAPLoavgAIPhy+Ff4TNs8yM+HIM5xzwthVSDIz5BW55U6yz/LH87NyXD7ABYaFQBIjQhYBip4LkfiOenmZv+Gaj7dvVHW35TeHMZewLt3z6q57ih0AEhNZXRob2QgZm9yIHRoZSBvd25lciBvciBtYW5hZ2VyIG9ubHkEkjD4Qm7jAPhG8nP6QZXU0dD6QN/6QZXU0dD6QN/XDR+V1NHQ0x/f1w0fldTR0NMf39GI+En4S8cF8uhliCP6Qm8T1wv/wwDy6GocGxoYAkCIJPpCbxPXC//DAPLoavgAVQL4clj4dQH4dvh32zzyABoZAKL4V/hW+FX4VPhT+FL4UfhQ+E/4TvhN+Ez4S/hK+EP4QsjL/8s/z4POVcDIzss/ywfLB8sHywfLB1VQyM5VQMjOyx9VIMjOyx/LH83Nzc3J7VQAKkFkZHJlc3MgY2FuJ3QgYmUgbnVsbAA8TWV0aG9kIGZvciB0aGUgY29sbGVjdGlvbiBvbmx5AhbtRNDXScIBio6A4iMdAf5w7UTQ9AVxIYBA9A6OJI0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABN/4anIhgED0Do4kjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE3/hrcyGAQPQOk9cLP5Fw4vhsdCGAQPQOk9cLB5FwHgHK4vhtdSGAQPQOk9cLB5Fw4vhudiGAQPQOk9cLB5Fw4vhvdyGAQPQOk9cLB5Fw4vhweCGAQPQOk9cLB5Fw4vhxjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE+HIfAMaNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4c3D4dI0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPh1cPh2cPh3gED0DvK91wv/+GJw+GMDjDD4RvLgTPhCbuMA0ds8JY4tJ9DTAfpAMDHIz4cgznHPC2FeQMjPklHsIyLOVTDIzssfWcjOyx/Nzc3JcPsAkl8F4uMA8gAjIiEAKO1E0NP/0z8x+ENYyMv/yz/Oye1UABT4UvhV+Fb4U/hUAKbtRNDT/9M/0wAx+kDU0dD6QNM/0wfTB9MH0wfTB9TR0PpA1NHQ+kDTH9TR0PpA0x/TH9H4d/h2+HX4dPhz+HL4cfhw+G/4bvht+Gz4a/hq+GP4YgAK+Eby4EwCCvSkIPShJyYAFHNvbCAwLjUyLjAAAA==",
    codeHash: "8baf7c53d345d4c809fa51a66913a7784d58289050a40f6f5aa3732b64431951",
};
module.exports = { CollectionTokenContract };