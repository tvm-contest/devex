import clientController from '../../common/utils/tonClient';

import { NUMBER_INPUT_ABI } from '../ABIs';
import { MessageType } from '../../common/types/commonTypes';
import { CurrentInput, SenderEnum } from '../../common/enums/enums';
import { addMessage, setAnswerId, setInput, setInterfaceId, setMinMax } from '../../store/appReducer';
import { store } from '../../store/store';
import decodeString from '../../common/utils/decodeString';

const ID = 'c5a9558b2664aed7dc3e6123436d544f13ffe69ab0e259412f48c6d1c8588401';

class NumberInput {
  id: string
  abi: any
  constructor() {
    this.id = ID;
    this.abi = NUMBER_INPUT_ABI;
  }

  get(params: any) {
    const { answerId, prompt, max, min, ...config } = params.value;

    config.min = min;
    config.max = max;

    if (max && min && parseInt(max) < parseInt(min)) {
      config.max = min;
    }

    const decodedPrompt = decodeString(prompt);

    const debotMessage: MessageType = {
      messageTitile: decodedPrompt,
      sender: SenderEnum.debot,
    };

    store.dispatch(setAnswerId(answerId));
    store.dispatch(setMinMax({ min, max }));
    store.dispatch(addMessage(debotMessage));
    store.dispatch(setInterfaceId(this.id));
    store.dispatch(setInput(CurrentInput.stringInput));
  }

  async call(params: any) {
    try {
      const decodedMessage =
        await clientController.client.abi.decode_message({
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
        case 'get':
          return this.get(extendedParams);

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

export default NumberInput;
