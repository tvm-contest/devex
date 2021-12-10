import { writable} from 'svelte/store';
import FatalElement from "./element/FatalElement";
import { TonClient, DebotModule } from "@tonclient/core";
import Callbacks from "./Callbacks";
import DebotInfoElement from "./element/DebotInfoElement";
import loopMessages from "./loopMessages";

export const elements = writable([]);
export const EngineLoading = writable(false);

export class Engine {
  constructor() {
    this.level = 1;
    this.clearVariables();
  }

  clearVariables() {
    this.debotSettings = {server: '', address: ''};
    this.client = null;
    this.engine = null;
    this.account = null;
    this.signingBox = 0;
    this.currentDebot = {};
    this.currentDebotAddress = null;
    this.elements = [];
    this.fetching = false;
    this.loading = false;
    this.launched = false;
    this.messages = [];
    this.isMessagesLooping = false;
    elements.set([]);
    EngineLoading.set(false);
  }

  getTonClient(server)  {
    let endpoints;
    switch (server) {
      case 'main.ton.dev':
        endpoints = ['main2.ton.dev', 'main3.ton.dev', 'main4.ton.dev'];
        break;
      case 'net.ton.dev':
        endpoints = ['net1.ton.dev', 'net5.ton.dev'];
        break;
      default:
        endpoints = [server];
    }

    const client = new TonClient({
      network: {endpoints}
    });

    return client;
  }

  async init(debotSettings, level) {
    const client = this.getTonClient(debotSettings.server);
    this.engine = new DebotModule(client);
    let debot, callbacks;
    try {
      callbacks = new Callbacks(this, level);
      debot = await this.engine.init({address: debotSettings.address}, callbacks);
    } catch (e) {
      await this.fatal(e, level);
      return;
    }
    if (this.level === level) {
      this.client = client;
      this.currentDebot = {debot, callbacks};
      this.currentDebotAddress = debotSettings.address;
      this.fetching = false;
      this.title = this.currentDebot.debot.info.name || 'appBar.tabs.untitled';
      const Element = new DebotInfoElement(debot.info);
      this.addElement(Element, level);
    }
  }

  async start() {
    this.loading = true;
    EngineLoading.set(true);
    if (!this.launched) {
      try {
        await this.engine.start({debot_handle: this.currentDebot.debot.debot_handle});
        this.loading = false;
        EngineLoading.set(false);
      } catch (e) {
        await this.fatal(e);
        return;
      }
      const newMessages = this.currentDebot.callbacks.messages.splice(0, this.currentDebot.callbacks.messages.length);
      this.launched = true;
      this.messages.push(...newMessages);
    }
    await loopMessages(this, this.level);
  }

  async setDebotSettings(server, address) {
    this.level++;
    await this.stopDebotIfActive();
    this.clearVariables();
    this.debotSettings = {server, address};
    this.fetching = true;
    await this.init(this.debotSettings, this.level);
  }

  setSigningBox(signingBox) {
    this.signingBox = signingBox;
  }

  setAccount(account) {
    this.account = account;
  }

  async execute(function_name, level, input = {}) {
    const debot = this.currentDebot;
    try {
      this.loading = true;
      EngineLoading.set(true);
      const message = (await this.client.abi.encode_internal_message({
        abi: {type: 'Json', value: debot.debot.debot_abi},
        address: this.currentDebotAddress,
        call_set: '0' !== function_name ? {function_name, input} : undefined,
        value: '1000000000000000'
      }));
      await this.engine.send({debot_handle: debot.debot.debot_handle, message: message.message});
      this.loading = false;
      EngineLoading.set(false);
    } catch (e) {
      console.log(e);
      await this.fatal(e, level);
      return;
    }
    const newMessages = debot.callbacks.messages.splice(0, debot.callbacks.messages.length);
    this.messages.push(...newMessages);
    await loopMessages(this, level);
  }

  addElement(element, level) {
    if (this.level === level) {
      this.elements.push(element);
      elements.set(this.elements);
    }
  }

  async refresh() {
    this.level++;
    const debotSettings = Object.assign({}, this.debotSettings);
    await this.setDebotSettings(debotSettings.server, debotSettings.address);
  }

  async fatal(e, level = null) {
    if (level === null || this.level === level) {
      this.level++;
      this.fetching = false;
      this.loading = false;
      EngineLoading.set(false);
      this.elements.push(new FatalElement(e));
      elements.set(this.elements);
      await this.stopDebotIfActive();
    }
  }

  async stopDebotIfActive() {
    if (this.currentDebotAddress !== null) {
      try {
        const debot = this.currentDebot.debot;
        await this.engine.remove({debot_handle: debot.debot_handle});
        this.currentDebot = undefined;
        this.currentDebotAddress = null;
      } catch (e) {
        console.error({message: 'Error stop debot', e});
      }
    }
  }
}
