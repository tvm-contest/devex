const {TonClient} = require("@tonclient/core")
const {libNode} = require("@tonclient/lib-node")
const { MsigKeys } = require('./msig.keys.js')
const { Msig } = require('./msig.js')
const {CollectionRootContract} = require ('../collection/CollectionRootContract')
const {CollectionContract} = require ('../collection/CollectionContract')
const {CollectionTokenContract} = require ('../collection/CollectionTokenContract')

TonClient.useBinaryLibrary(libNode)

async function deployCollectionRoot (client) {
    //const rootKeys = await client.crypto.generate_random_sign_keys();
    const rootKeys = {"public":"c9db4ce5aef2d3ffb832df3bb3e8b7bd426fea253962e918f028867e42350a4f","secret":"724260a17e4a2d1b7ec321b7a1215963a5c1cb2dd867f14fca557b14181fd97c"}
    console.log('root keys:'+JSON.stringify(rootKeys));

    const rootAbi = {
        type: 'Contract',
        value: CollectionRootContract.abi
    }
    const deployOptions = {
        abi: rootAbi,
        deploy_set: {
            tvc: CollectionRootContract.tvc,
            initial_data: {}
        },
        call_set: {
            function_name: 'constructor',
            input: {
                manager: Msig.address,
                creationMinValue: 500000000,
                creationFee : 100000000,
                name : "CollectionRoot1",
                symbol: "COL1",
                collectionCode: CollectionContract.code,
                colTokenCode: CollectionTokenContract.code,
            }
        },
        signer: {
            type: 'Keys',
            keys: rootKeys
        }
    }

    const { address } = await client.abi.encode_message(deployOptions);
    console.log(`Future address of the contract will be: ${address}`);
    await transfer(client,address,400000000);

    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
      });

    console.log(`RootCollection contract was deployed at address: ${address}`);
    await getCollectionRootInfo(client, address);
}

async function getCollectionRootInfo(client, root) {
    const abi = {
        type: 'Contract',
        value: CollectionRootContract.abi
    }
    const address = root;
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

    response = await client.tvm.run_tvm({ message, account, abi });
    console.log('CollectionRoot getInfo:', response.decoded.output);
}

async function transfer (client, dst, amount) {

    const msig_abi = {
        type: 'Contract',
        value: Msig.abi
    }

    const params = {
        send_events: false,
        message_encode_params: {
            address: Msig.address,
            abi:msig_abi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest:dst,
                    value:amount,
                    bounce:false,
                    flags:1,
                    payload: ""
                }
            },
            signer: { type: 'Keys', keys: MsigKeys}
        }
    }

    try {
        await client.processing.process_message(params);
        console.log(`Evers transfered to ${dst}`);
    } catch (error) {
    console.error(error);
  }
}

(async () => {

    const client = new TonClient({
        network: {
            // Blockchain node URL
            endpoints: ["https://main.ton.dev"]
            //endpoints: ["https://net.ton.dev"]
            //endpoints: ["http://localhost:8080"]
        }
    });
    try {

        await deployCollectionRoot(client)

    } catch (err) {
        console.error(err)
    }
    client.close()
})()
