import terminal from "./terminal";
import base64 from "./base64";
import hex from "./hex";
import amountInput from "./amountInput";
import menu from "./menu";
import confirmInput from "./confirmInput";
import addressInput from "./addressInput";
import numberInput from "./numberInput";
import qrCode from "./qrCode";
import userInfo from "./userInfo";
import signingBoxInput from "./signingBoxInput";
import network from "./network";
import media from "./media";
import CallInterfaceException from "./../exception/CallInterfaceException";
import FunctionNotImplementedException from "./../exception/FunctionNotImplementedException";
import SelectKeyElement from "./../element/SelectKeyElement";

const interfaces = [terminal, base64, hex, menu, amountInput, confirmInput, addressInput, numberInput, qrCode, userInfo, signingBoxInput, network, media];

const getInterface = (id) => {
  for (const ifc of interfaces) {
    if (ifc.id === id) {
      return ifc;
    }
  }
  throw new CallInterfaceException(`Implementation of interface '${id}' was not found`);
}

export default {
  async call(Engine, id, msg) {
    const ifc = getInterface(id);
    const decodedBody = await Engine.client.abi.decode_message_body({abi: ifc.abi, body: msg.body, is_internal: true});
    const func = decodedBody.name;
    const params = decodedBody.value;
    if ([userInfo.id, signingBoxInput.id].includes(ifc.id)) {
      const resolve = function () {
        const input = ifc.call(Engine, func, params);
        Engine.execute(params.answerId, Engine.level, input);
      }
      if (Engine.account == null || signingBoxInput.id == ifc.id) {
        const reject = () => {
          throw 'Reject select key';
        }
        return new SelectKeyElement(resolve, reject);
      } else {
        resolve();
        return null;
      }
    } else {
      try {
        return ifc.call(func, params);
      } catch (e) {
        if (e instanceof FunctionNotImplementedException) {
          throw new CallInterfaceException(`Function '${func}' of interface '${id}' isn't implemented.`);
        } else {
          throw e;
        }
      }
    }
  }
}
