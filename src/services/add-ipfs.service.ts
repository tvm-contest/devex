const IPFS = require('ipfs-core');

class ipfsAddService {

    async addFileToIPFS(file) {
        const ipfs = await IPFS.create();
        const { cid } = await ipfs.add(file);
        await ipfs.stop();
        return cid;
    }
}

export const { addFileToIPFS } = new ipfsAddService()
