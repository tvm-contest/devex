import { TonClient, KeyPair, AppSigningBox } from '@tonclient/core';
export default class SigningBox implements AppSigningBox {
    client: TonClient
    keys: KeyPair
    public_key: any
    constructor(client: TonClient, keys: KeyPair) {
        this.client = client
        this.keys = keys
        this.public_key = keys.public
    }

    async get_public_key() {
        return { public_key: this.keys.public }
    }

    async sign(params: any) {
        console.log(params)
        return await this.client.crypto.sign({
            keys: this.keys,
            unsigned: params.unsigned,
        })
    }
}