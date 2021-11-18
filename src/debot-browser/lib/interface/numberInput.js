import { Buffer } from 'buffer';
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import InputNumberElement from "./../element/InputNumberElement";

const funcs = {
  get({prompt, answerId, min, max}) {
    return new InputNumberElement(Buffer(prompt, "hex").toString(), answerId, min, max);
  }
};

export default {
  id: 'c5a9558b2664aed7dc3e6123436d544f13ffe69ab0e259412f48c6d1c8588401',
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
            {"name": "min", "type": "int256"},
            {"name": "max", "type": "int256"}
          ],
          "outputs": [
            {"name": "value", "type": "int256"}
          ]
        },
        {
          "name": "constructor",
          "inputs": [],
          "outputs": []
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
