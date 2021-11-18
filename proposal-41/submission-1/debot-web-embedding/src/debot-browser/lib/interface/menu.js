import { Buffer } from 'buffer';
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import MenuElement from "./../element/MenuElement";

const funcs = {
  select(params) {
    const title = Buffer(params.title, "hex").toString();
    const choices = [];
    for (const item of params.items) {
      choices.push({
        handlerId: item.handlerId,
        title: Buffer(item.title, "hex").toString(),
        description: Buffer(item.description, "hex").toString(),
      });
    }
    return new MenuElement(title, choices);
  }
};

export default {
  id: 'ac1a4d3ecea232e49783df4a23a81823cdca3205dc58cd20c4db259c25605b48',
  abi: {
    type: 'Contract',
    value: {
      "ABI version": 2,
      "header": ["time"],
      "functions": [
        {
          "name": "select",
          "inputs": [
            {"name": "title", "type": "bytes"},
            {"name": "description", "type": "bytes"},
            {
              "components": [{"name": "title", "type": "bytes"}, {
                "name": "description",
                "type": "bytes"
              }, {"name": "handlerId", "type": "uint32"}], "name": "items", "type": "tuple[]"
            }
          ],
          "outputs": [
            {"name": "index", "type": "uint32"}
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
