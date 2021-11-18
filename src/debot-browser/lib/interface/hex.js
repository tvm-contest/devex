import { Buffer } from 'buffer';
import FunctionNotImplementedException from "../exception/FunctionNotImplementedException";
import HexElement from "../element/HexElement";

const funcs = {
  encode({answerId, prompt}) {
    return new HexElement(answerId, Buffer(prompt, "hex").toString(), 'encode');
  },
  decode({answerId, prompt}) {
    return new HexElement(answerId, Buffer(prompt, "hex").toString(), 'decode');
  }
};

export default {
  id: 'xedfbb00d6ebd16d57a1636774845af9499b400ba417da8552f40b1250256ff8f',
  abi: {
    "ABI version": 2,
    "header": ["time"],
    "functions": [
      {
        "name": "encode",
        "inputs": [
          {"name":"answerId","type":"uint32"},
          {"name":"data","type":"bytes"}
        ],
        "outputs": [
          {"name":"hexstr","type":"bytes"}
        ]
      },
      {
        "name": "decode",
        "inputs": [
          {"name":"answerId","type":"uint32"},
          {"name":"hexstr","type":"bytes"}
        ],
        "outputs": [
          {"name":"data","type":"bytes"}
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
    "data": [
    ],
    "events": [
    ]
  },
  call(func, params) {
    if (typeof funcs[func] === 'undefined') {
      throw new FunctionNotImplementedException();
    }
    return funcs[func](params);
  },
}
