import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";

const funcs = {
  getAccount(Engine) {
    const value = null !== Engine.account.address
      ? Engine.account.address
      : '0:0000000000000000000000000000000000000000000000000000000000000000'
    return {value};
  },
  getPublicKey(Engine) {
    return {value: `0x${Engine.account.publicKey}`};
  },
  getSigningBox(Engine) {
    return {value: Engine.signingBox};
  },
};

export default {
  id: 'a56115147709ed3437efb89460b94a120b7fe94379c795d1ebb0435a847ee580',
  abi: {
    type: 'Contract',
    value: {
      "ABI version": 2,
      "header": ["time"],
      "functions": [
        {
          "name": "getAccount",
          "inputs": [
            {"name":"answerId","type":"uint32"}
          ],
          "outputs": [
            {"name":"value","type":"address"}
          ]
        },
        {
          "name": "getPublicKey",
          "inputs": [
            {"name":"answerId","type":"uint32"}
          ],
          "outputs": [
            {"name":"value","type":"uint256"}
          ]
        },
        {
          "name": "getSigningBox",
          "inputs": [
            {"name":"answerId","type":"uint32"}
          ],
          "outputs": [
            {"name":"handle","type":"uint32"}
          ]
        },
        {
          "name": "constructor",
          "inputs": [
          ],
          "outputs": [
          ]
        }
      ],
      "data": [],
      "events": []
    }
  },
  call(Engine, func, params) {
    if (typeof funcs[func] === 'undefined') {
      throw new FunctionNotImplementedException();
    }
    return funcs[func](Engine, params);
  },
}
