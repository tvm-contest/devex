// https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_debot.md#DebotHandle

import DebotUseActionsException from "./exception/DebotUseActionsException";
import SelectKeyElement from "./element/SelectKeyElement";
import { writable} from 'svelte/store';

export const approve = writable();

export default function Callbacks(Engine, level) {
  this.messages = [];
  this.get_signing_box = function () {
    return new Promise((resolve, reject) => {
      if (Engine.signingBox !== null) {
        resolve(Engine.signingBox);
      } else {
        const Element = new SelectKeyElement(resolve, reject);
        Engine.addElement(Element, level);
      }
    });
  }
  this.send = async function (ParamsOfAppDebotBrowserSend) {
    this.messages.push(ParamsOfAppDebotBrowserSend);
  }
  this.approve = function (params) {
    return new Promise((resolve) => {
      approve.set({activity: params.activity, resolve});
    });
  }
  this.log = function (/*ParamsOfAppDebotBrowserLog*/) {
    // console.log(ParamsOfAppDebotBrowserLog)
  }
  this.switch = function (/*ParamsOfAppDebotBrowserSwitch*/) {
    // console.log(ParamsOfAppDebotBrowserSwitch)
  }
  this.switch_completed = function () {
    // console.log('switch_completed');
  }
  this.show_action = function () {
    Engine.fatal(new DebotUseActionsException(), level);
  }
  this.input = function (ParamsOfAppDebotBrowserInput) {
    console.log(ParamsOfAppDebotBrowserInput)
  }
  this.invoke_debot = function (ParamsOfAppDebotBrowserInvokeDebot) {
    console.log(ParamsOfAppDebotBrowserInvokeDebot)
  }
}
