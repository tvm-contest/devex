import * as fs from 'fs';
import path from 'path';
import { Account } from '@tonclient/appkit';
import { libNode } from '@tonclient/lib-node';
import { TonClient } from '@tonclient/core';
import { globals } from '../config/globals';
import { everscale_settings } from '../config/everscale-settings';
import { DeployService } from './deploy.service';

export class DirectSaleService {
    private deployService: DeployService;
    private client: TonClient;

    constructor() {
        TonClient.useBinaryLibrary(libNode);

        this.client = new TonClient({
            network: {
                endpoints: [everscale_settings.ENDPOINTS]
            }
        });
        this.deployService = new DeployService();
    }

    async deployDirectSaleRoot(collectionPath: string, addrRoyaltyAgent: string, royaltyPercent: number) : Promise<string> {
        let directSaleRootAcc = await this.createDirectSaleRootAccount(collectionPath);
        let directSaleAcc = await this.createDirectSaleAccount(collectionPath);
        let initInput = await this.buildInitInputForDeployDirectSaleRoot(collectionPath, addrRoyaltyAgent, royaltyPercent);
        await this.deployService.deploy(directSaleRootAcc, initInput);
        
        return await directSaleRootAcc.getAddress();
    }
    
    async deployDirectSale(collectionPath: string, nftAddr: string) : Promise<string> {
        let nftAbi = await JSON.parse(fs.readFileSync(path.join(globals.RESULT_COLLECTION, collectionPath, "Data.abi.json")).toString());
        let nftTvc = fs.readFileSync(path.resolve(path.join(globals.RESULT_COLLECTION, collectionPath, "Data.tvc")), {encoding: 'base64'});
        let nftAcc = new Account({
            abi: nftAbi,
            tvc: nftTvc
        }, {
            address: nftAddr,
            client: this.client,
            signer: {
                type: "Keys",
                keys: everscale_settings.SAFE_MULTISIG_KEYS
            }
        });
        let directSaleRootAcc = await this.createDirectSaleRootAccount(collectionPath);
        let directSaleRootAddr = await directSaleRootAcc.getAddress();
        let walletAcc = await this.getWalletAcc();
        
        await this.landOwnership(nftAcc, walletAcc, directSaleRootAddr, nftAddr);
        await this.createSale(directSaleRootAcc, walletAcc, directSaleRootAddr, nftAddr);
        let saleAddr = await this.getSaleAddr(directSaleRootAcc, nftAddr);
        return saleAddr;
    }
    
    async getSaleAddr(directSaleRootAcc: Account, nftAddr) : Promise<any> {
        let saleAddr = await directSaleRootAcc.runLocal('getSaleAddress',
        {
            'addrOwner': everscale_settings.SAFE_MULTISIG_ADDRESS,
            'addrNft': nftAddr
        });
        if (saleAddr.decoded !== undefined) {
            if (saleAddr.decoded.out_messages) {
                return saleAddr.decoded.output.addrSale;
            }
        }
        else return "0";
    }

    async startSale(collectionPath: string, directSaleAddr: string, nftPrise: number, isDurationLimited: boolean, saleDuration: number) {
        let directSaleAcc = await this.createDirectSaleAccount(collectionPath);
        let walletAcc = await this.getWalletAcc();
        let { body } = await this.client.abi.encode_message_body({
            abi: directSaleAcc.abi,
            signer: {
                type: "Keys",
                keys: everscale_settings.SAFE_MULTISIG_KEYS
            },
            is_internal: true,
            call_set: {
                function_name: "start",
                input: {
                    nftPrice: nftPrise,
                    isDurationLimited: isDurationLimited,
                    saleDuration: saleDuration
                }
            },
        });
        try {
            await walletAcc.run(
                "sendTransaction",
                {
                    dest: directSaleAddr,
                    value: 100_000_000,
                    flags: 3,
                    bounce: true,
                    payload: body,
                }
            );
            console.log("Start sale token, address sale: " + directSaleAddr);
        } catch(err) {
            console.log(err);
        }
    }
    
    private async createDirectSaleRootAccount(collectionPath: string) : Promise<Account> {
        let pathDirectSale = path.join(globals.RESULT_COLLECTION, collectionPath, "DirectSaleRoot.sol");
        let directSaleRootCode = fs.readFileSync(pathDirectSale, 'utf8');
        let directSaleRootAcc= await this.deployService.createContractAccount(directSaleRootCode, path.join(globals.RESULT_COLLECTION, collectionPath), "DirectSaleRoot");
        return directSaleRootAcc;
    }

    private async createDirectSaleAccount(collectionPath: string) : Promise<Account> {
        let pathDirectSale = path.join(globals.RESULT_COLLECTION, collectionPath, "DirectSale.sol");
        let directSaleCode = fs.readFileSync(pathDirectSale, 'utf8');
        let directSaleAcc= await this.deployService.createContractAccount(directSaleCode,  path.join(globals.RESULT_COLLECTION, collectionPath), "DirectSale");
        return directSaleAcc;
    }
    
    private async buildInitInputForDeployDirectSaleRoot(collectionPath: string, addrRoyaltyAgent: string, royaltyPercent: number) : Promise<object> {
        
        let tvc = Buffer.from(fs.readFileSync(path.join(globals.RESULT_COLLECTION, collectionPath, "DirectSale.tvc"))).toString("base64");
        let initInput = {
            codeSale: (await this.client.boc.get_code_from_tvc({tvc: tvc})).code,
            addrRoyaltyAgent: addrRoyaltyAgent,
            royaltyPercent: royaltyPercent
        };
        return initInput;
    }

    private async landOwnership(nftAcc: Account, walletAcc: Account, directSaleRootAddr: string, addrNft: string) {
        let { body } = await this.client.abi.encode_message_body({
            abi: nftAcc.abi,
            signer: {
                type: "Keys",
                keys: everscale_settings.SAFE_MULTISIG_KEYS
            },
            is_internal: true,
            call_set: {
                function_name: "lendOwnership",
                input: {
                    _addr: directSaleRootAddr
                }
            },
        });
        try {
            await walletAcc.run(
                "sendTransaction",
                {
                    dest: addrNft,
                    value: 100_000_000,
                    flags: 3,
                    bounce: true,
                    payload: body,
                }
            );
        } catch(err) {
            console.log(err);
        }
    }

    private async createSale(directSaleRootAcc: Account, walletAcc: Account, directSaleRootAddr: string, addrNft: string) {
        let { body } = await this.client.abi.encode_message_body({
            abi: directSaleRootAcc.abi,
            signer: {
                type: "Keys",
                keys: everscale_settings.SAFE_MULTISIG_KEYS
            },
            is_internal: true,
            call_set: {
                function_name: "createSale",
                input: {
                    addrNft: addrNft
                }
            },
        });
        try {
            await walletAcc.run(
                "sendTransaction",
                {
                    dest: directSaleRootAddr,
                    value: 2_000_000_000,
                    flags: 3,
                    bounce: true,
                    payload: body,
                }
            );
        } catch(err) {
            console.log(err)
        }
    }

    private async getWalletAcc() : Promise<Account> {
        let walletAbi = await JSON.parse(fs.readFileSync(path.resolve(globals.SAMPLE_DATA_PATH, "safeMultisigWallet", "SafeMultisigWallet.abi.json")).toString());
        let walletTvc = fs.readFileSync(path.resolve(globals.SAMPLE_DATA_PATH, "safeMultisigWallet", "SafeMultisigWallet.tvc"), {encoding: 'base64'});
        const walletAcc = new Account(
            {
                abi: walletAbi, 
                tvc: walletTvc
            },
            {
                client: this.client,
                address: everscale_settings.SAFE_MULTISIG_ADDRESS,
                signer: {
                    type: "Keys",
                    keys: everscale_settings.SAFE_MULTISIG_KEYS
                }
            }
        );
        return walletAcc;
    }
}