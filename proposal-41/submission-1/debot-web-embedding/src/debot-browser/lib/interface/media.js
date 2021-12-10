import { Buffer } from 'buffer';
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import MediaElement from "../element/MediaElement";

const funcs = {
  output({data, prompt, answerId}) {
    return new MediaElement(Buffer(data, "hex").toString(), Buffer(prompt, "hex").toString(), answerId);
  }
};

export default {
  id: '59cdc2aafe53760937dac5b1c4b89ce12950f56a56298108a987cfe49b7c84b5',
  abi: {
    type: 'Contract',
    value: {
      "ABI version": 2,
      "header": ["time"],
      "functions": [
        {
          "name": "output",
          "inputs": [
            {"name": "answerId", "type": "uint32"},
            {"name": "prompt", "type": "bytes"},
            {"name": "data", "type": "bytes"}
          ],
          "outputs": [
            {"name": "result", "type": "uint8"}
          ]
        },
        {
          "name": "getSupportedMediaTypes",
          "inputs": [
            {"name": "answerId", "type": "uint32"}
          ],
          "outputs": [
            {"name": "mediaTypes", "type": "bytes"}
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
