export const login = async (state, dispatch, isInit) => {
  if (isInit) {
    if (!localStorage.getItem('ton_inited')) {
      return;
    }
  }
  if (!state.ton.isReady) {
    return;
  }
  const { accountInteraction } = await state.ton.provider.requestPermissions({
    permissions: ['tonClient', 'accountInteraction']
  });
  localStorage.setItem('ton_inited', 1);
  dispatch({
    type: 'SET_ACCOUNT',
    payload: {
      isReady: true,
      address: accountInteraction.address.toString()
    }
  });
};

export const logout = async (state, dispatch) => {
  await state.ton.provider.disconnect();
  dispatch({
    type: 'SET_ACCOUNT',
    payload: {
      isReady: false,
      address: null
    }
  });
  localStorage.removeItem('ton_inited');
};
