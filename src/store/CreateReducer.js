import { ProviderRpcClient } from 'ton-inpage-provider';
import { useReducer, useEffect } from 'react';

import reducer from './reducer';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const InitTon = async (dispatch) => {
  if (!window.hasTonProvider) {
    await delay(100);
    if (!window.hasTonProvider) {
      await delay(200);
      if (!window.hasTonProvider) {
        console.error('no ton provider');
        return;
      }
    }
  }
  const ton = new ProviderRpcClient();
  window.ourTon = ton; // TODO remove

  await ton.ensureInitialized();
  dispatch({ type: 'TON_READY', provider: ton });
};

const CreateReducer = () => {
  const [state, dispatch] = useReducer(reducer, {
    ton: {
      provider: null,
      isReady: false
    },
    account: {
      isReady: false,
      address: null,
      balance: null, // maybe in future we can use ton.getBalance().
      ava: null // maybe.
    }
  });
  useEffect(() => {
    InitTon(dispatch);
  }, []);

  return [state, dispatch];
};

export default CreateReducer;
