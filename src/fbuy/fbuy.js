/** 
* FBUY
* E-commerce layer functionality, including
* payments, order forms, messaging, etc.
* 
* 
* 
*/ 

"use strict";

const EventEmitter = require("events");
const { Fapp_cfg } = require("../fapp/fapp_cfg.js");
const cfg = require("../../libfood.json");
const { Fbigint } = Fapp_cfg.ENV[cfg.ENV] === Fapp_cfg.ENV.REACT_NATIVE ? 
  require("../ftypes/fbigint/fbigint_rn.js") : require("../ftypes/fbigint/fbigint_node.js");
const { Fid_pub } = require("../fid/fid_pub.js");
const { Fbuy_net } = require("./net/fbuy_net.js");
const { Fbuy_msg } = require("./fbuy_msg.js");
const { Fbuy_sms } = require("./fbuy_sms.js");
const { Fbuy_tsact } = require("./fbuy_tsact.js");
const { Fbuy_status } = require("./fbuy_status.js");
const { Flog } = require("../flog/flog.js");
const { Ftrans_rinfo } = require("../ftrans/ftrans_rinfo.js");

class Fbuy {
  net;
  fid_pub;
  res;
  status;

  FLAVOR_RES_EXEC = new Map([
    [Fbuy_msg.FLAVOR.TRANSACT, this._res_transact],
    [Fbuy_msg.FLAVOR.STATUS, this._res_status],
    [Fbuy_msg.FLAVOR.SMS, this._res_sms]
  ]);

  constructor({net = null, fid_pub = null} = {}) {
    if (!(net instanceof Fbuy_net)) {
      throw new TypeError("Argument 'net' must be instance of Fbuy_net");
    }

    this.net = net;
    this.fid_pub = fid_pub;
    this.res = new EventEmitter();
    this.status = new EventEmitter();
  }

  _on_message(msg, rinfo) {
    if (msg.type === Fbuy_msg.TYPE.RES) {
      Flog.log(`[FBUY] ${Object.keys(Fbuy_msg.FLAVOR)[msg.flavor]} ` +
        `REQ # ${msg.data.id ? msg.data.id.toString() : msg.id.toString()} OK`);
      
      this.res.emit(msg.id.toString(), msg);
    } else {
      this._on_req(msg, rinfo);
    }
  }

  /** 
   * Transaction hook. Don't set this directly, use on_transact()
   */ 
  _transact_hook(req, rinfo) {
    // Do nothing
  }

  _res_transact(req, rinfo) {
    this._transact_hook(req, rinfo);

    return new Fbuy_msg({
      data: new Fbuy_tsact({order: null, pment: null, id: req.data.id}),
      type: Fbuy_msg.TYPE.RES,
      flavor: Fbuy_msg.FLAVOR.TRANSACT,
      id: req.id
    });
  }

  /**
   * SMS hook. Don't set this directly, use on_sms()
   */ 
  _sms_hook(req, rinfo) {
    // Do nothing
  }

  _res_sms(req, rinfo) {
    this._sms_hook(req, rinfo);

    return new Fbuy_msg({
      data: new Fbuy_sms({from: this.fid_pub}),
      type: Fbuy_msg.TYPE.RES,
      flavor: Fbuy_msg.FLAVOR.SMS,
      id: req.id
    });
  }

  _res_status(req, rinfo) {
    this.status.emit(`${req.data.id}#${req.data.code}`, req);

    return new Fbuy_msg({
      data: new Fbuy_status({id: req.data.id, code: req.data.code}),
      type: Fbuy_msg.TYPE.RES,
      flavor: Fbuy_msg.FLAVOR.STATUS,
      id: req.id
    });
  }

  _on_req(msg, rinfo) {
    Flog.log(`[FBUY] Inbound ${Object.keys(Fbuy_msg.FLAVOR)[msg.flavor]} ` +
      `REQ from ${rinfo.address}:${rinfo.port}`)
    
    const res = this.FLAVOR_RES_EXEC.get(msg.flavor).bind(this)(msg, rinfo);
    this._send(res, rinfo);
  }

  _send(msg, ftrans_rinfo, success = () => {}, timeout = () => {}) {
    if (msg.type === Fbuy_msg.TYPE.REQ) {
      const outgoing = new Promise((resolve, reject) => {
        const timeout_id = setTimeout(() => {
          this.res.removeAllListeners(msg.id.toString());
          reject();
        }, this.net.MSG_TIMEOUT);

        this.res.once(msg.id.toString(), (res_msg) => {
          clearTimeout(timeout_id);
          success(res_msg, this);
          resolve();
        });
      }).catch((reason) => {
        timeout(msg);
      });
    } 

    Flog.log(`[FBUY] Outbound ${Object.keys(Fbuy_msg.FLAVOR)[msg.flavor]} ` +
      `${Object.keys(Fbuy_msg.TYPE)[msg.type]} # ${msg.data.id ? 
        msg.data.id.toString() : msg.id.toString()} to ${ftrans_rinfo.address}:${ftrans_rinfo.port}`);
    
    this.net._out(msg, ftrans_rinfo); 
  }

  /**
   * Send a transaction request
   */ 
  transact_req({
    fbuy_transaction = null, 
    addr = null, 
    port = null, 
    pubkey = null, 
    success = () => {}, 
    timeout = () => {}
  } = {}) {
    // TODO: For sanity during development, explicitly require arguments
    if (fbuy_transaction === null || addr === null || port === null || pubkey === null) {
      throw new TypeError("Arguments cannot be null");
    }

    const msg = new Fbuy_msg({
      data: fbuy_transaction,
      type: Fbuy_msg.TYPE.REQ,
      flavor: Fbuy_msg.FLAVOR.TRANSACT,
      id: Fbigint.unsafe_random(Fbuy_msg.ID_LEN)
    });

    this._send(msg, new Ftrans_rinfo({address: addr, port: port, pubkey: pubkey}), success, timeout);
  }

  /**
   * Send a status request
   */ 
  status_req({
    fbuy_status = null, 
    addr = null, port = null, 
    pubkey = null, 
    success = () => {}, 
    timeout = () => {}
  } = {}) {
    // TODO: For sanity during development, explicitly require arguments
    if (fbuy_status === null || addr === null || port === null || pubkey === null) {
      throw new TypeError("Arguments cannot be null");
    }

    const msg = new Fbuy_msg({
      data: fbuy_status,
      type: Fbuy_msg.TYPE.REQ,
      flavor: Fbuy_msg.FLAVOR.STATUS,
      id: Fbigint.unsafe_random(Fbuy_msg.ID_LEN)
    });

    this._send(msg, new Ftrans_rinfo({address: addr, port: port, pubkey: pubkey}), success, timeout);
  }

  /**
   * Send an SMS request
   */ 
  sms_req({
    fbuy_sms = null, 
    addr = null, 
    port = null, 
    pubkey = null, 
    success = () => {}, 
    timeout = () => {}
  } = {}) {
    // For sanity during development, explicitly require arguments
    if (fbuy_sms === null || addr === null || port === null || pubkey === null) {
      throw new TypeError("Arguments cannot be null");
    }

    const msg = new Fbuy_msg({
      data: fbuy_sms,
      type: Fbuy_msg.TYPE.REQ,
      flavor: Fbuy_msg.FLAVOR.SMS,
      id: Fbigint.unsafe_random(Fbuy_msg.ID_LEN)
    });

    this._send(msg, new Ftrans_rinfo({address: addr, port: port, pubkey: pubkey}), success, timeout);
  }

  start() {
    this.net.network.on("message", this._on_message.bind(this));
    Flog.log(`[FBUY] Online`);
  }

  stop() {
    this.net.network.removeListener("message", this._on_message.bind(this));
    Flog.log(`[FBUY] Offline`);
  }

  /** 
   * Set the transaction hook, aka the actions to take upon receipt of an incoming transaction
   */ 
  on_transact(f) {
    if (typeof f !== "function") {
      throw new TypeError("Argument 'f' must be a function");
    }

    this._transact_hook = f;
  }

  /**
   * Set the SMS hook, aka the actions to take upon receipt of an incoming SMS message
   */ 
  on_sms(f) {
    if (typeof f !== "function") {
      throw new TypeError("Argument 'f' must be a function");
    }

    this._sms_hook = f;
  }

  /**
   * Listen only once for the next status event for a given transaction ID and status code
   */ 
  on_status(transact_id, status_code, cb) {
    this.status.once(`${transact_id}#${status_code}`, cb);
  }
}

module.exports.Fbuy = Fbuy;
