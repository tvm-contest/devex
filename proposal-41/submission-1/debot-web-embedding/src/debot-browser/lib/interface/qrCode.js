import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import ScanQrCodeElement from "./../element/ScanQrCodeElement";

const funcs = {
  scan({answerId}) {
    return new ScanQrCodeElement(answerId);
  },
};

export default {
  id: '940c152ddf4f920f742507f461026dc08ac56ed3392944d6d3863a409570056b',
  abi: {
    type: 'Contract',
    value: {
      "ABI version": 2,
      "header": ["time"],
      "functions": [
        {
          "name": "scan",
          "inputs": [
            {"name": "answerId", "type": "uint32"}
          ],
          "outputs": [
            {"name": "value", "type": "bytes"}
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
