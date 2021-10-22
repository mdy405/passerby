/** 
* FSTUN_NET
* Base class for an FSTUN net module
* Net modules are FSTUN's IO layer: a net module subscribes to some
* FTRANS module(s) incoming network data events, determines whether incoming
* data is intended for FSTUN, deserializes & validates the data -- and, for
* outbound data, preps and sends it to FTRANS for transmission
*/  

"use strict";

const EventEmitter = require("events");

class Fstun_net {  
  network;
  MSG_TIMEOUT;

  constructor() {
    this.network = new EventEmitter();
    this.MSG_TIMEOUT = 5000;
  }

  _in(msg, rinfo) {
    this.network.emit("message", msg, rinfo);
  }

  _out(msg, rinfo) {
    throw new Error("Subclasses must implement the _out() method");
  }
}

module.exports.Fstun_net = Fstun_net;