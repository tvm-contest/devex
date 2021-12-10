import { Buffer } from 'buffer';
import FunctionNotImplementedException from "../exception/FunctionNotImplementedException";
import Base64Element from "../element/Base64Element";

const funcs = {
  encode({answerId, prompt}) {
    return new Base64Element(answerId, Buffer(prompt, "hex").toString(), 'encode');
  },
  decode({answerId, prompt}) {
    return new Base64Element(answerId, Buffer(prompt, "hex").toString(), 'decode');
  }
};

export default {
  id: '8913b27b45267aad3ee08437e64029ac38fb59274f19adca0b23c4f957c8cfa1',
  abi: {
    type: 'Contract',
    value: {
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
            {"name":"base64","type":"bytes"}
          ]
        },
        {
          "name": "decode",
          "inputs": [
            {"name":"answerId","type":"uint32"},
            {"name":"base64","type":"bytes"}
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
    }
  },
  call(func, params) {
    if (typeof funcs[func] === 'undefined') {
      throw new FunctionNotImplementedException();
    }
    return funcs[func](params);
  },
}
