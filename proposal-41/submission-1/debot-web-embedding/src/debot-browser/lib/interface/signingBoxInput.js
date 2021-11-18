import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";

const funcs = {
  get(Engine) {
    return {handle: Engine.signingBox.signing_box};
  },
};

export default {
  id: 'c13024e101c95e71afb1f5fa6d72f633d51e721de0320d73dfd6121a54e4d40a',
  abi: {
    type: 'Contract',
    value: {
      "ABI version": 2,
      "header": ["time"],
      "functions": [
        {
          "name": "get",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"},
            {"name": "possiblePublicKeys", "type": "uint256[]"}
          ],
          "outputs": [
            {"name": "handle", "type": "uint32"}
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
