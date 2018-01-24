const EventEmitter = require("events")

class MixerEvents extends EventEmitter {}

const emitter = new MixerEvents()

module.exports = emitter;
