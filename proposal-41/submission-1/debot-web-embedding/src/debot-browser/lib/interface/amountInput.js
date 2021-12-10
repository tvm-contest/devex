import { Buffer } from 'buffer';
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import InputAmountElement from "./../element/InputAmountElement";

const funcs = {
  get({prompt, answerId, min, max, decimals}) {
    return new InputAmountElement(Buffer(prompt, "hex").toString(), answerId, min, max, decimals);
  }
};

export default {
  id: 'a1d347099e29c1624c8890619daf207bde18e92df5220a54bcc6d858309ece84',
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
            {"name": "decimals", "type": "uint8"},
            {"name": "min", "type": "uint128"},
            {"name": "max", "type": "uint128"}
          ],
          "outputs": [
            {"name": "value", "type": "uint128"}
          ]
        }
      ],
      "data": [],
      "events": []
    }
  },
  call(func, params) {
    if (typeof funcs[func] === 'undefined') {
      throw new FunctionNotImplementedException();
    }
    return funcs[func](params);
  },
}
