import { Buffer } from 'buffer';
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import TextElement from "./../element/TextElement";
import InputElement from "./../element/InputElement";

const funcs = {
  print({message, answerId}) {
    return new TextElement(Buffer(message, "hex").toString(), answerId);
  }, 
  input({answerId, prompt, multiline}) {
    return new InputElement(Buffer(prompt, "hex").toString(), answerId, multiline);
  }
};

export default {
  id: '8796536366ee21852db56dccb60bc564598b618c865fc50c8b1ab740bba128e3',
  abi: {
    type: 'Contract',
    value: {
      "ABI version": 2,
      "header": ["time"],
      "functions": [
        {
          "name": "input",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"},
            {"name": "multiline", "type": "bool"}
          ],
          "outputs": [
            {"name": "value", "type": "bytes"}
          ]
        },
        {
          "name": "inputStr",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"},
            {"name": "multiline", "type": "bool"}
          ],
          "outputs": [
            {"name": "value", "type": "bytes"}
          ]
        },
        {
          "name": "inputInt",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"}
          ],
          "outputs": [
            {"name": "value", "type": "int256"}
          ]
        },
        {
          "name": "inputUint",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"}
          ],
          "outputs": [
            {"name": "value", "type": "uint256"}
          ]
        },
        {
          "name": "inputTons",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"}
          ],
          "outputs": [
            {"name": "value", "type": "uint128"}
          ]
        },
        {
          "name": "inputBoolean",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"}
          ],
          "outputs": [
            {"name": "value", "type": "bool"}
          ]
        },
        {
          "name": "print",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "message", "type": "bytes"}
          ],
          "outputs": []
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
