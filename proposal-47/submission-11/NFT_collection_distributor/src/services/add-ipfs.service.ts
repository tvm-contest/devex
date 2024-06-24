import { ipfs_setting } from "../config/ipfs-setting";

const ipfsClent = require('ipfs-http-client');

class ipfsAddService {  

    addFileToIPFS = async (file) => {
        const ipfs = new ipfsClent.create({
            host: ipfs_setting.HOST,
            port: ipfs_setting.PORT,
            protocol: ipfs_setting.PROTOCOL
        });
        const fileAdded = await ipfs.add({content: file});
        const fileHash = fileAdded.path;
        return fileHash
    }
}

export const { addFileToIPFS } = new ipfsAddService()
