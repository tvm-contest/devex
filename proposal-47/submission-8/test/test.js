const {TonClient} = require("@tonclient/core")
const {libNode} = require("@tonclient/lib-node")
const { deployConfig } = require('../config/deploy_config.js')
const { NFTCollectionContract } = require('../contracts/NFTCollectionContract.js')
const { ImageContract } = require('../contracts/ImageContract.js')
const { TokenContract } = require('../contracts/TokenContract.js')
const { UserCertContract } = require('../contracts/UserCertContract.js')
const {SafeMultisigWallet} = require('../utils/SafeMultisigWallet')
const {get_tokens_from_giver} = require('../utils/giver')
var fs = require('fs');
const { exit } = require("process")

TonClient.useBinaryLibrary(libNode)

async function deployMultisig (client) {
    const keys = await client.crypto.generate_random_sign_keys();

    let safeMultisigWalletKeys = {
        type: "Keys",
        keys: keys
    };
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const deployOptions = {
        abi: wallet_abi,
        deploy_set: {
            tvc: SafeMultisigWallet.tvc,
            initial_data: {}
        },
        call_set: {
            function_name: 'constructor',
            input: {
                "owners": ['0x'+keys.public],
                "reqConfirms": 1
            }
        },
        signer: safeMultisigWalletKeys
    }

    const { address } = await client.abi.encode_message(deployOptions);
    await get_tokens_from_giver(client, address, 100_000_000_000);

    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
      });

    return {address, keys}
}

async function deployNTFCollection (client, supply, wallet1) {
    const collectionKeys = await client.crypto.generate_random_sign_keys();
    const collectionAbi = {
        type: 'Contract',
        value: NFTCollectionContract.abi
    }
    const deployOptions = {
        abi: collectionAbi,
        deploy_set: {
            tvc: NFTCollectionContract.tvc,
            initial_data: {}
        },
        call_set: {
            function_name: "constructor",
            input: {
                owner: wallet1.address,
                supply: supply,
                imageCode: ImageContract.code,
                tokenCode: TokenContract.code,
                certCode: UserCertContract.code

            }
        },
        signer: {
            type: 'Keys',
            keys: collectionKeys
        }
    }
    const { address } = await client.abi.encode_message(deployOptions);
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const params = {
        address: wallet1.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:address,
                value:1_000_000_000,
                bounce:false,
                flags:1,
                payload: ""
            }
        },
        signer: { type: 'Keys', keys: wallet1.keys}
    }
    await client.processing.process_message({
            send_events: false,
            message_encode_params: params
    });
    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
      });
    console.log(`NTFCollection contract was deployed at address: ${address}`);
    return address;
}

async function getImageAddress(client,nftRoot, levelId, id) {
    const abi = {
        type: 'Contract',
        value: NFTCollectionContract.abi
    }
    const address = nftRoot;
    const [account, message] = await Promise.all([
        client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'boc'
        })
        .then(({ result }) => result[0].boc)
        .catch(() => {
            throw Error(`Failed to fetch account data`)
        }),
        client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getImageAddress',
                input: {levelId, id}
            },
            signer: { type: 'None' }
        }).then(({ message }) => message)
    ]);
    try {
        const response = await client.tvm.run_tvm({ message, account, abi });
        return response.decoded.output.addr;
    } catch (error) {
        console.error(error);
    }
}

async function setImageProps(client, imageAddress, chunks, price, nextLevelImageCount, name, wallet1){
    const abi = {
        type: 'Contract',
        value: ImageContract.abi
    }
    const hexname = Buffer.from(name, 'utf8').toString('hex');
    const body =await client.abi.encode_message_body({
        abi,
        call_set: {
            function_name: "setImageProps",
            input: {
                chunks, price, nextLevelImageCount, name:hexname
            }
        },
        is_internal: true,
        signer: {
            type:"None"
        }
    })
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const params = {
        address: wallet1.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:imageAddress,
                value:100_000_000,
                bounce:true,
                flags:1,
                payload: body.body
            }
        },
        signer: { type: 'Keys', keys: wallet1.keys}
    }

    try {
        await client.processing.process_message({
            send_events: false,
            message_encode_params: params
          });
    } catch (error) {
        console.error(error);
    }
}

async function addLevel(client, nftRoot, imgCount, amount, wallet1) {
    const abi = {
        type: 'Contract',
        value: NFTCollectionContract.abi
    }
    const body =await client.abi.encode_message_body({
        abi,
        call_set: {
            function_name: "addLevel",
            input: {
                imgCount
            }
        },
        is_internal: true,
        signer: {
            type:"None"
        }
    })
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const params = {
        address: wallet1.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:nftRoot,
                value: amount,
                bounce:true,
                flags:1,
                payload: body.body
            }
        },
        signer: { type: 'Keys', keys: wallet1.keys}
    }

    try {
        const message = await client.abi.encode_message(params);
        await client.processing.send_message({
            message:message.message,
            send_events: false
            });
        const in_msg = await client.boc.get_boc_hash({ boc: message.message });
        await client.net.query_transaction_tree({in_msg: in_msg.hash});
    } catch (error) {
        console.error(error);
        exit(1)
    }
}


async function fillImageContent(client, imageAddress, chunkNumber, part, wallet1){
    const abi = {
        type: 'Contract',
        value: ImageContract.abi
    }
    const body =await client.abi.encode_message_body({
        abi,
        call_set: {
            function_name: "fillContent",
            input: {
                chunkNumber, part
            }
        },
        is_internal: true,
        signer: {
            type:"None"
        }
    })
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const params = {
        address: wallet1.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:imageAddress,
                value:500_000_000,
                bounce:true,
                flags:1,
                payload: body.body
            }
        },
        signer: { type: 'Keys', keys: wallet1.keys}
    }

    try {
        await client.processing.process_message({
            send_events: false,
            message_encode_params: params
          });
    } catch (error) {
        console.error(error);
    }
}

async function setComplete (client, nftRoot, wallet1) {
    const abi = {
        type: 'Contract',
        value: NFTCollectionContract.abi
    }
    const body =await client.abi.encode_message_body({
        abi,
        call_set: {
            function_name: "setComplete",
            input: {
            }
        },
        is_internal: true,
        signer: {
            type:"None"
        }
    })
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const params = {
        address: wallet1.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:nftRoot,
                value:50_000_000,
                bounce:true,
                flags:1,
                payload: body.body
            }
        },
        signer: { type: 'Keys', keys: wallet1.keys}
    }
    try {
        const message = await client.abi.encode_message(params);
        await client.processing.send_message({
            message:message.message,
            send_events: false
            });
        const in_msg = await client.boc.get_boc_hash({ boc: message.message });
        await client.net.query_transaction_tree({in_msg: in_msg.hash});
    } catch (error) {
        console.error(error);
    }
}


async function getNTFCollectionInfo(client,nftRoot) {
    const abi = {
        type: 'Contract',
        value: NFTCollectionContract.abi
    }
    const address = nftRoot;
    const [account, message] = await Promise.all([
        client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'boc'
        })
        .then(({ result }) => result[0].boc)
        .catch(() => {
            throw Error(`Failed to fetch account data`)
        }),
        client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getInfo',
                input: {}
            },
            signer: { type: 'None' }
        }).then(({ message }) => message)
    ]);

    try {
        response = await client.tvm.run_tvm({ message, account, abi });
    } catch (error) {
        console.error(error);
    }

    return response.decoded.output;
}

async function getImageInfo(client, imageAddress) {
    const abi = {
        type: 'Contract',
        value: ImageContract.abi
    }
    const address = imageAddress;
    const [account, message] = await Promise.all([
        client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'boc'
        })
        .then(({ result }) => result[0].boc)
        .catch(() => {
            throw Error(`Failed to fetch account data`)
        }),
        client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getInfo',
                input: {}
            },
            signer: { type: 'None' }
        }).then(({ message }) => message)
    ]);

    try {
        const response = await client.tvm.run_tvm({ message, account, abi });
        return response.decoded.output;
    } catch (error) {
        console.error(error);
    }

}

async function getImageContent(client, imageAddress) {
    const abi = {
        type: 'Contract',
        value: ImageContract.abi
    }
    const address = imageAddress;
    const [account, message] = await Promise.all([
        client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'boc'
        })
        .then(({ result }) => result[0].boc)
        .catch(() => {
            throw Error(`Failed to fetch account data`)
        }),
        client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getContent',
                input: {}
            },
            signer: { type: 'None' }
        }).then(({ message }) => message)
    ]);
    try {
        const response = await client.tvm.run_tvm({ message, account, abi });
        return response.decoded.output;
    } catch (error) {
        console.error(error);
    }
}

async function mintToken(client, nftRoot, wallet1, imgIds, token2send) {
    const abi = {
        type: 'Contract',
        value: NFTCollectionContract.abi
    }
    const body =await client.abi.encode_message_body({
        abi,
        call_set: {
            function_name: "mint",
            input: {
                imgIds
            }
        },
        is_internal: true,
        signer: {
            type:"None"
        }
    })
    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }
    const params = {
        address: wallet1.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:nftRoot,
                value:token2send,
                bounce:true,
                flags:1,
                payload: body.body
            }
        },
        signer: { type: 'Keys', keys: wallet1.keys}
    }
    try {
        const message = await client.abi.encode_message(params);
        await client.processing.send_message({
            message:message.message,
            send_events: false
            });
        const in_msg = await client.boc.get_boc_hash({ boc: message.message });
        await client.net.query_transaction_tree({in_msg: in_msg.hash});
    } catch (error) {
        console.error(error);
    }
}

async function getUserTokensForRoot(client, root, owner){
    const addr = owner.split(':');
    try {
    let salt = await client.boc.encode_boc({builder:[
       {type: 'Integer',
        size: 1,
        value: "0x1" },
       {type: 'Integer',
        size: 1,
        value: "0x0" },
       {type: 'Integer',
        size: 1,
        value: "0x0" },
       {type: 'Integer',
        size: 8,
        value: "0x0" },
       {type: 'Integer',
        size: 256,
        value: "0x"+addr[1] }
    ]})
    let code = await client.boc.set_code_salt({
            code: UserCertContract.code,
            salt: salt.boc
        })

    const codeHash = await client.boc.get_boc_hash({ boc: code.code });

    const accounts = await client.net.query_collection({
        collection: 'accounts',
            filter: { code_hash: { eq: codeHash.hash } },
            result: 'id data'
    })

    let tokens = [];
    for (let i=0; i<accounts.result.length; i++) {
        const abi = {
            type: 'Contract',
            value: UserCertContract.abi
        }
        const address = accounts.result[i].id
        const [account, message] = await Promise.all([
            client.net.query_collection({
                collection: 'accounts',
                filter: { id: { eq: address } },
                result: 'boc'
            })
            .then(({ result }) => result[0].boc)
            .catch(() => {
                throw Error(`Failed to fetch account data`)
            }),
            client.abi.encode_message({
                abi,
                address,
                call_set: {
                    function_name: 'getToken',
                    input: {}
                },
                signer: { type: 'None' }
            }).then(({ message }) => message)
        ]);

        try {
            const response = await client.tvm.run_tvm({ message, account, abi });
            tokens.push(response.decoded.output.token);
        } catch (error) {
            console.error(error);
        }
    }

    let rootTokens = [];
    for (let i=0; i<tokens.length; i++) {
        const abi = {
            type: 'Contract',
            value: TokenContract.abi
        }
        const address = tokens[i];
        const [account, message] = await Promise.all([
            client.net.query_collection({
                collection: 'accounts',
                filter: { id: { eq: address } },
                result: 'boc'
            })
            .then(({ result }) => result[0].boc)
            .catch(() => {
                throw Error(`Failed to fetch account data`)
            }),
            client.abi.encode_message({
                abi,
                address,
                call_set: {
                    function_name: 'getInfo',
                    input: {_answer_id:0}
                },
                signer: { type: 'None' }
            }).then(({ message }) => message)
        ]);

        const response = await client.tvm.run_tvm({ message, account, abi });
        if (response.decoded.output.value0 == root)
        {
            rootTokens.push(tokens[i]);
        }
    }

    return rootTokens;

    } catch (error) {
        console.error(error);
    }
}

async function changeOwnerToken(client, token, oldOwner, newOwner) {
    const abi = {
        type: 'Contract',
        value: TokenContract.abi
    }

    const body =await client.abi.encode_message_body({
        abi,
        call_set: {
            function_name: "changeOwner",
            input: {
                newOwner
            }
        },
        is_internal: true,
        signer: {
            type:"None"
        }
    })

    const wallet_abi = {
        type: 'Contract',
        value: SafeMultisigWallet.abi
    }

    const params = {
        address: oldOwner.address,
        abi:wallet_abi,
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest:token,
                value:200_000_000,
                bounce:true,
                flags:1,
                payload: body.body
            }
        },
        signer: { type: 'Keys', keys: oldOwner.keys}
    }

    try {
        const message = await client.abi.encode_message(params);
        await client.processing.send_message({
            message:message.message,
            send_events: false
            });
        const in_msg = await client.boc.get_boc_hash({ boc: message.message });
        await client.net.query_transaction_tree({in_msg: in_msg.hash});
    } catch (error) {
        console.error(error);
    }
}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: deployConfig.endpoints
        }
    });
    try {
        let version = await client.client.version()
        console.log(JSON.stringify(version))

        const wallet1 = await deployMultisig(client)
        console.log("wallet1",JSON.stringify(wallet1))
        const wallet2 = await deployMultisig(client)
        console.log("wallet2",JSON.stringify(wallet2))

        let maxCount = 1
        for (let i=0; i<deployConfig.levels.length; i++) {
            maxCount*=deployConfig.levels[0].images.length
        }
        if (deployConfig.supply>maxCount) {
            console.log("Error max supply is ",maxCount)
            process.exit()
        }
        let nftRoot = await deployNTFCollection(client,deployConfig.supply,wallet1)
        for (let i=0; i<deployConfig.levels.length; i++) {
            console.log("   Deploing level",i)
            const amount = 100_000_000 * deployConfig.levels[i].images.length + 250_000_000
            await addLevel(client,nftRoot,deployConfig.levels[i].images.length,amount,wallet1)
            for (let j=0; j<deployConfig.levels[i].images.length; j++) {
                console.log("       Deploing image",j)
                const img = await getImageAddress(client,nftRoot,i,j)
                const nextLvlCount = deployConfig.levels[i+1] ? deployConfig.levels[i].images.length: 0;

                let buf = fs.readFileSync(deployConfig.levels[i].images[j].path).toString('hex')
                let chuncks = buf.match(/.{1,20000}/g);

                await setImageProps(client, img, chuncks.length, deployConfig.levels[i].images[j].price, nextLvlCount, deployConfig.levels[i].images[j].name,wallet1);

                for(let c=0; c<chuncks.length; c++) {
                    console.log(`           Setting chunk ${c+1}/${chuncks.length}`);
                    await fillImageContent(client, img, c, chuncks[c],wallet1);
                }
            }
        }
        await setComplete(client,nftRoot,wallet1)
        console.log("NFTCollection deployed at address",nftRoot)
        console.log("Checking integrity...")
        const rootInfo = await getNTFCollectionInfo(client,nftRoot)
        if (rootInfo.owner != wallet1.address) {
            console.log('[INTEGRITY ERROR] wrong owner_wallet')
        }
        if (rootInfo.supply != deployConfig.supply) {
            console.log('[INTEGRITY ERROR] wrong supply')
        }
        if (rootInfo.levelCount != deployConfig.levels.length) {
            console.log('[INTEGRITY ERROR] wrong levelCount')
        }
        if (rootInfo.firstLvlImgCount != deployConfig.levels[0].images.length) {
            console.log('[INTEGRITY ERROR] wrong firstLvlImgCount')
        }
        if (!rootInfo.complete) {
            console.log('[INTEGRITY ERROR] complete not true')
        }
        for (let i=0; i<deployConfig.levels.length; i++) {
            console.log("   Checking level",i)
            const nextLvlCount = deployConfig.levels[i+1] ? deployConfig.levels[i].images.length: 0
            for (let j=0; j<deployConfig.levels[i].images.length; j++) {
                console.log("       Checking image",j)
                const img = await getImageAddress(client,nftRoot,i,j)
                const imageInfo = await getImageInfo(client, img)
                const buf = fs.readFileSync(deployConfig.levels[i].images[j].path).toString('hex')
                const chunks = buf.match(/.{1,20000}/g);

                if (Buffer.from(imageInfo.name, 'hex').toString('utf8') != deployConfig.levels[i].images[j].name) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong name`)
                }
                if (!imageInfo.complete) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} complete not true`)
                }
                if (imageInfo.nextLevelImageCount != nextLvlCount) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong nextLevelImageCount`)
                }
                if (imageInfo.levelImageCount != deployConfig.levels[i].images.length) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong levelImageCount`)
                }
                if (imageInfo.price != deployConfig.levels[i].images[j].price) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong name`)
                }
                if (imageInfo.chunks != chunks.length) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong chuncks`)
                }
                if (imageInfo.owner != wallet1.address) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong owner`)
                }
                if (imageInfo.root != nftRoot) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong root`)
                }
                const imageContent = await getImageContent(client, img)
                let str = ""
                for (let c = 0; c<chunks.length; c++) {
                    str = str.concat(imageContent.content[`${c}`])
                }
                if (buf != str) {
                    console.log(`[INTEGRITY ERROR] Image level ${i} id ${j} wrong content`)
                }
            }
        }
        console.log("Check integrity done!")

        await mintToken(client, nftRoot, wallet2, [0,2,0,0], 8_000_000_000)
        await mintToken(client, nftRoot, wallet2, [0,0,0,0], 9_000_000_000)
        await mintToken(client, nftRoot, wallet2, [0,0,0,1], 10_000_000_000)
        let user2Tokens = await getUserTokensForRoot(client, nftRoot, wallet2.address)
        console.log(user2Tokens)
        if (user2Tokens.length!=2) {console.log(`[MINT ERROR] Await 2 tokens`)}

        await changeOwnerToken(client, user2Tokens[0], wallet2, wallet1.address)
        user2Tokens = await getUserTokensForRoot(client, nftRoot, wallet2.address)
        console.log(user2Tokens)
        if (user2Tokens.length!=1) {console.log(`[MINT ERROR] Await 1 token for wallet2`)}
        user2Tokens = await getUserTokensForRoot(client, nftRoot, wallet1.address)
        console.log(user2Tokens)
        if (user2Tokens.length!=1) {console.log(`[MINT ERROR] Await 1 token for wallet1`)}

        console.log(`[DONE]`)
    } catch (err) {
        console.error(err)
    }
    client.close()
})()
