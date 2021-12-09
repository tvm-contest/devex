const { readFileSync } = require("fs");
const { create } = require("ipfs-http-client");

export class UploadFileToIPFSService {
    private ipfsClient = create('https://ipfs.infura.io:5001/api/v0');

    /**
     * Upload the file under specified path to IPFS
     * @param filepath path to the file
     * @returns url to the file in IPFS
    */
    async upload(filepath: string) : Promise<string> {
        const file = readFileSync(filepath);
        const added = await this.ipfsClient.add(file);
        return `https://ipfs.infura.io/ipfs/${added.path}`;
    }
}