import ifc from "./interface";

const DEBOT_WC = '-31';

export default async function loopMessages(Engine, level) {
  if (Engine.isMessagesLooping) {
    return;
  }
  Engine.isMessagesLooping = true;
  while (Engine.messages.length > 0) {
    if (Engine.level === level) {
      const message = Engine.messages.shift();
      try {
        const msg = (await Engine.client.boc.parse_message({boc: message.message})).parsed;
        const [dstWc, id] = msg.dst.split(':');
        if (DEBOT_WC === dstWc) {
          const Element = await ifc.call(Engine, id, msg, level);
          if (null !== Element) {
            Engine.addElement(Element, level);
          }
        } else {
          Engine.loading = true;
          const debot = Engine.currentDebot;
          await Engine.engine.send({debot_handle: debot.debot.debot_handle, message: message.message});
          const newMessages = debot.callbacks.messages.splice(0, debot.callbacks.messages.length);
          Engine.messages.push(...newMessages);
        }
      } catch (e) {
        await Engine.fatal(e, level);
      } finally {
        Engine.loading = false;
      }
    } else {
      return;
    }
  }
  Engine.isMessagesLooping = false;
}
