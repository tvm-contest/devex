import { useState } from 'react';
import { TonClient, signerNone, signerKeys, accountForExecutorUninit } from '@tonclient/core';

import { libWeb } from '@tonclient/lib-web';
import { Account } from '@tonclient/appkit';
import * as jsonData from './contracts.json';

const TonSDK = async () => {
  TonClient.useBinaryLibrary(libWeb);

  const [newAddress, setNewAddress] = useState('');
  const { abi, tvc } = jsonData;
  console.log(abi, tvc);
  const client = new TonClient({
    network: {
      endpoints: ['net.ton.dev'] // dev
      // message_processing_timeout: 200000,
    },
    abi: {
      // message_expiration_timeout: 200000,
    }
  });

  const keys = await client.crypto.generate_random_sign_keys();
  const newSigner = signerKeys(keys);

  const getAddress = async () => {
    const publicKey = await getPublicKey();

    if (!newAddress) {
      // await this.whenReady();
      if (!publicKey) {
        return '0';
      }

      const deployOptions = {
        abi: {
          type: 'Contract',
          value: abi
        },
        deploy_set: {
          tvc,
          initial_pubkey: publicKey
        },
        call_set: {
          function_name: 'constructor'
        },
        signer: {
          type: 'External',
          public_key: publicKey
        }
      };

      const result = await client.abi.encode_message(deployOptions).catch((e) => {
        console.error(deployOptions);
        // eslint-disable-next-line no-console
        console.error(e);
      });

      if (!result) {
        // eslint-disable-next-line no-console
        console.error('Not able to detect address');
        throw new Error('Not able to detect address');
      }

      // eslint-disable-next-line no-console
      console.log(`Future address of the contract will be: ${result.address}`);
      setNewAddress(result.address);
    }

    return newAddress;
  };

  const getPublicKey = async () => {
    let key;
    if (newSigner) {
      key = newSigner.keys.publicKey;
    }

    // key = `0x${key}`;
    // eslint-disable-next-line no-console
    console.log('key', key);
    return key;
  };

  const getAddresInfo = async (address) => {
    const answer = {
      isExist: false,
      isInited: false,
      balance: 0
    };
    const { result } = await client.net.query_collection({
      collection: 'accounts',
      filter: {
        id: {
          eq: address
        }
      },
      result: 'acc_type balance code'
    });
    if (result.length === 0) {
      return answer;
    }

    return {
      balance: result[0].balance,
      isExist: true,
      isInited: !!result[0].acc_type
    };
  };

  const sendMoney = async (address, value) => {
    const acc = new Account(
      {
        abi,
        tvc
      },
      { signer: keys, client }
    );
    const amount = Math.floor((value + 20) * 1_000_000_000);
    // eslint-disable-next-line no-console
    console.log('send', value + 20, 'rubys to', address);
    return acc.run('sendValue', {
      dest: address,
      amount,
      bounce: false
    });
  };

  const getBalance = async (address) => {
    // const address = await this.getAddress();
    if (address) {
      const balance = await client.net.query_collection({
        collection: 'accounts',
        filter: {
          id: {
            eq: address
          }
        },
        result: 'balance'
      });

      if (balance.result?.length) {
        const bln = balance.result[0].balance;
        return bln / 1000000000;
      }
    }
    return Number.NaN;
  };

  const deployContract = async (initialParams, constructorParams) => {
    // await this.whenReady();
    const randomKey = await client.crypto.generate_random_sign_keys();
    const deployOptions = {
      abi: {
        type: 'Contract',
        value: abi
      },
      deploy_set: {
        tvc,
        initial_data: initialParams,
        initial_pubkey: randomKey.public
      },
      call_set: {
        function_name: 'constructor',
        input: constructorParams
      },
      signer: {
        type: 'Keys',
        keys: keys.keys
      }
    };

    const result = await client.abi.encode_message(deployOptions).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(deployOptions);
      // eslint-disable-next-line no-console
      console.error(e);
    });

    if (!result) {
      // eslint-disable-next-line no-console
      console.error('Not able to detect address');
      throw new Error('Not able to detect address');
    }

    // eslint-disable-next-line no-console
    console.log(`Future address of the contract will be: ${result.address}`);

    const addressInfo = await getAddresInfo(result.address);

    const executorResult = await client.tvm.run_executor({
      account: accountForExecutorUninit(),
      abi: { type: 'Contract', value: abi },
      message: result.message
    });
    // const executorResult = {
    //   fees: { total_account_fees: BigInt(15000000000) },
    // };
    const addressBalance = Number(addressInfo.balance);
    const executorFees = Number(executorResult.fees.total_account_fees);

    if (addressInfo.isInited) return result.address;

    // eslint-disable-next-line no-console
    console.log(`Total fee to deploy: ${executorResult.fees.total_account_fees}`);

    if (addressBalance <= executorFees) {
      // eslint-disable-next-line no-console
      console.log(
        `Account balance ${addressInfo.balance} less then total fee to deploy: ${executorResult.fees.total_account_fees}. Transfering money here`
      );
      const difference = executorFees - addressBalance;
      const fees = difference / 1000000000;

      const controllerAddress = await getAddress();
      const controllerBalance = await getBalance(controllerAddress);

      const executorFeesInDec = executorFees / 1_000_000_000;
      if (controllerBalance < executorFeesInDec) {
        // noMoneyFallback(
        //   controllerAddress,
        //   executorFeesInDec - controllerBalance,
        // );
        throw new Error('Not enough money');
      } else {
        try {
          await sendMoney(result.address, fees);
        } catch (e) {
          throw new Error(e.message);
        }
      }
    }

    const deployResult = await client.processing
      .process_message({
        send_events: false,
        message_encode_params: deployOptions
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        throw new Error(e);
      });

    // eslint-disable-next-line no-console
    console.log(`Success: ${deployResult.transaction.account_addr} `);

    return deployResult.transaction.account_addr;
  };

  const getContractAtAddress = (address, initialParams) => {
    const tonContract = new Account(
      {
        abi,
        tvc
      },
      {
        signer: keys,
        address,
        client,
        initData: initialParams
      }
    );
    return tonContract;
  };

  const run = async (functionName, input, address) => {
    // await this.whenReady();
    const message = await client.abi.encode_message({
      address,
      abi: {
        type: 'Contract',
        value: abi
      },
      signer: signerNone(),
      call_set: {
        function_name: functionName,
        input
      }
    });

    const boc = await client.net.wait_for_collection({
      collection: 'accounts',
      filter: { id: { eq: address } },
      result: 'boc',
      timeout: 1000
    });

    const result = await client.tvm.run_tvm({
      account: boc.result.boc,
      abi: {
        type: 'Contract',
        value: abi
      },
      message: message.message
    });
    return result.decoded?.out_messages[0].value;
  };

  const call = async (functionName, input, address) => {
    // await this.whenReady();
    const contract = await getContractAtAddress(address);
    const result = await contract.run(functionName, input || {});
    // todo here also parse some data
    return result;
  };

  return 'hi';
};

export default TonSDK;
