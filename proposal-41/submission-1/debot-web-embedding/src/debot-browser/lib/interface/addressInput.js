import { Buffer } from 'buffer';
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import InputAddressElement from "./../element/InputAddressElement";

const funcs = {
  get({answerId, prompt}) {
    return new InputAddressElement(Buffer(prompt, "hex").toString(), answerId);
  }
};

export default {
  id: 'd7ed1bd8e6230871116f4522e58df0a93c5520c56f4ade23ef3d8919a984653b',
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
            {"name": "prompt", "type": "bytes"}
          ],
          "outputs": [
            {"name": "value", "type": "address"}
          ]
        },
        {
          "name": "select",
          "inputs": [
            {"name": "answerId", "type": "uint32"}
          ],
          "outputs": [
            {"name": "value", "type": "address"}
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
