const accountAction = {
  login: async (store, dispatch, isInit) => {
    if (isInit) {
      if (!localStorage.getItem('ton_inited')) {
        return;
      }
    }
    const { accountInteraction } = await store.ton.requestPermissions({
      permissions: ['tonClient', 'accountInteraction']
    });
    dispatch({
      action: 'SET_ACCOUNT',
      payload: {
        isReady: true,
        address: accountInteraction.address
      }
    });
  },
  logout: async (ton) => {
    await ton.disconnect();
    localStorage.removeItem('ton_inited');
  }
};

export default accountAction;
