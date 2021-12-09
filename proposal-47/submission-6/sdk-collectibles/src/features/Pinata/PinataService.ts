import pinataClient, { PinataClient, PinataPinResponse } from "@pinata/sdk";
import fs from "fs";
import fetch, { Blob } from "node-fetch";
import { Series } from "../../db/Series/entities/Series";
import { ErrorCode } from "../../utils/ErrorCode";
import path from "path";
import Jimp from "jimp";

export class PinataService {
    private readonly api_key: string;
    private readonly secret: string;
    private readonly pinataClient: PinataClient;
    private readonly gateway: string;
    constructor() {
      const { PINATA_APIKEY, PINATA_SECRET, PINATA_GATEWAY } = process.env;
      this.gateway = PINATA_GATEWAY || '';
      this.api_key = PINATA_APIKEY || '';
      this.secret = PINATA_SECRET || '';
      this.pinataClient = pinataClient(PINATA_APIKEY || '', PINATA_SECRET || '');
    }

    public async test() {
      this.pinataClient.testAuthentication().then((result) => {
        //handle successful authentication here
        console.log(result);
      }).catch((err) => {
        //handle error here
        console.log(err);
      });
    }

    public async uploadBuffer(image: Buffer, extension: string) {
      const date = new Date().toISOString();
      const uri = path.resolve(__dirname, `../../../public/image/${date}-merged`);
      await fs.mkdirSync(uri);
      await fs.promises.writeFile(`${uri}/index.${extension}`, image, {});
      const stream = fs.createReadStream(`${uri}/index.${extension}`);
      return await this.pinataClient.pinFileToIPFS(stream);
    }

    public async uploadFile(file: Express.Multer.File) {
      try {
        const stream = fs.createReadStream(file.path);
        return await this.pinataClient.pinFileToIPFS(stream);
      } catch (e: any) {
        console.log(e.code);
        if (e.code === ErrorCode.ENOENT) {
          await fs.promises.writeFile(file.path.replace('file.filename', ''), file.mimetype);
          const stream = fs.createReadStream(file.path);
          return await this.pinataClient.pinFileToIPFS(stream);
        }

        throw e;
      }
    }

    public async uploadJson(json: Record<string, unknown>): Promise<PinataPinResponse> {
      return await this.pinataClient.pinJSONToIPFS(json);
    }

    public async getSeriesJson(hash: string): Promise<Omit<Series, "hash">>{
      const res = await fetch(this.gateway + hash);
      const text = await res.text();
      if (!text) throw new Error('No series in IPFS');
      return JSON.parse(text);
    }

    public async getImage(hash: string, collectionId: string, layer: string): Promise<string | undefined> {
      const uri = path.resolve(__dirname, `../../../public/image/${collectionId}_${layer}-${hash}`);
      try {
        let res = await fetch(this.gateway + hash);
        if (
          !res.ok ||
                res.status === 429 ||
                !res.headers.get('content-type')?.includes('image') ||
                parseInt(res.headers.get('Content-Length') || '0', 10) === 0
        ) {
          await this.sleep(2000);
          res = await fetch(this.gateway + hash);
        }

        await fs.mkdirSync(
          uri,
          {
            recursive: true,
          }
        );
        await res.body.pipe(fs.createWriteStream(uri + '/index.png'));
        const jimp = await Jimp.read(uri + '/index.png');
        await jimp.getMIME();
      } catch (e) {
        console.log('Pinata get image error');
        return undefined;
      }
      return uri + '/index.png';
    }

    public blobToFile = (theBlob: Blob, fileName: string): Express.Multer.File => {
      const b: any = theBlob;
      //A Blob() is almost a File() - it's just missing the two properties below which we will add
      b.lastModifiedDate = new Date();
      b.name = fileName;

      //Cast to a File() type
      return <Express.Multer.File><unknown>theBlob;
    };
    
    public async pinList() {
      return await this.pinataClient.pinList();
    }
    
    public sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
}
