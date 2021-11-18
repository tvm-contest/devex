import { MessageType } from './../../common/types/commonTypes';
import tonClientController from '../../common/utils/tonClient';
import { store } from './../../store/store';

import { runDebotFunction } from '../../common/utils/callDebotFunction';
import encodeString from '../../common/utils/encodeString';
import { MEDIA_ABI } from '../ABIs';
import { addMessage, setAnswerId, setInterfaceId } from '../../store/appReducer';
import decodeString from '../../common/utils/decodeString';
import { MessageTypeEnum, SenderEnum } from '../../common/enums/enums';

const ID = '59cdc2aafe53760937dac5b1c4b89ce12950f56a56298108a987cfe49b7c84b5';

class Media {
  id: string
  abi: any
  mediaTypes: string[]
  constructor() {
    this.id = ID;
    this.abi = MEDIA_ABI;
    this.mediaTypes = [
      encodeString('image/png'),
      encodeString('image/jpg'),
      encodeString('image/jpeg'),
      encodeString('image/bmp'),
      encodeString('image/gif'),
      encodeString('image/webp'),
    ];
  }

  async getSupportedMediaTypes(params: any) {
    const {
      value: { answerId },
      debotAddress,
    } = params;

    try {
      await runDebotFunction(
        answerId,
        this.id,
        { mediaTypes: this.mediaTypes }
      );
    } catch (err: any) {
      console.error(err.message);
    }
  }

  output(params: any) {
    const { answerId, data, prompt } = params.value;

    const decodedData = decodeString(data);
    const decodedDescription = decodeString(prompt);

    const message1: MessageType = {
      messageTitile: decodedDescription,
      sender: SenderEnum.debot,
      type: MessageTypeEnum.string
    }
    const message2: MessageType = {
      messageTitile: decodedData,
      sender: SenderEnum.debot,
      type: MessageTypeEnum.img
    }

    store.dispatch(addMessage(message1))
    store.dispatch(addMessage(message2))

    runDebotFunction(answerId, this.id, { result: 0 })
  }

  async call(params: any) {
    try {
      const decodedMessage =
        await tonClientController.client.abi.decode_message({
          abi: {
            type: 'Contract',
            value: this.abi,
          },
          message: params.message,
        });

      const extendedParams = {
        ...params,
        ...decodedMessage,
      };

      switch (decodedMessage.name) {
        case 'getSupportedMediaTypes':
          return this.getSupportedMediaTypes(extendedParams);

        case 'output':
          return this.output(extendedParams);

        default:
          throw new Error(
            `Function does not exist on interface: ${this.constructor.name}`
          );
      }
    } catch (err) {
      console.error('Interface execution failed: ', err);
    }
  }
}

export default Media;
