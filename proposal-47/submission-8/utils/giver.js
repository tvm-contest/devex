// Address of giver on TON OS SE
const giverAddress = '0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415';

const GiverAbi = {
    'ABI version': 2,
    header: ['time', 'expire'],
    functions: [
        {
            name: 'sendTransaction',
            inputs: [
                { 'name': 'dest', 'type': 'address' },
                { 'name': 'value', 'type': 'uint128' },
                { 'name': 'bounce', 'type': 'bool' }
            ],
            outputs: []
        },
        {
            name: 'getMessages',
            inputs: [],
            outputs: [
                {
                    components: [
                        { name: 'hash', type: 'uint256' },
                        { name: 'expireAt', type: 'uint64' }
                    ],
                    name: 'messages',
                    type: 'tuple[]'
                }
            ]
        },
        {
            name: 'upgrade',
            inputs: [
                { name: 'newcode', type: 'cell' }
            ],
            outputs: []
        },
        {
            name: 'constructor',
            inputs: [],
            outputs: []
        }
    ],
    data: [],
    events: []
};

// Giver ABI on TON OS SE
const giverAbi = {
    type: 'Contract',
    value: GiverAbi
}

// Giver keypair:
const giverKeyPair = {
    public: '2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16',
    secret: '172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3'
};

// Requesting 10 local test tokens from TON OS SE giver
async function get_tokens_from_giver(client, account, amount) {
    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: giverAbi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: amount,
                    bounce: false
                }
            },
            signer: {
                type: 'Keys',
                keys: giverKeyPair
            },
        },
    }
    await client.processing.process_message(params)
}

module.exports = {get_tokens_from_giver}