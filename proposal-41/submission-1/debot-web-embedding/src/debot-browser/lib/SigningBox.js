export default class SigningBox {
  constructor(publicKey, signer) {
    this.public_key = publicKey;
    this.signer = signer;
  }

  get_public_key() {
    return { public_key: this.public_key };
  }

  async sign(params) {
    return await this.signer(params.unsigned);
  }
}
