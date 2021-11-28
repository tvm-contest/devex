const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ACCOUNT':
      return { ...state, account: { ...state.account, ...action.payload } };
    case 'TON_READY':
      return { ...state, ton: { ...state.ton, provider: action.provider } };
    default:
      throw new Error();
  }
};

export default reducer;
