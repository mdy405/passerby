/** 
* FAPP_BBOARD
* Free Food's torrent equivalent: a publicly
* sharable data structure which describes a network
* resource (restaurant food). A restaurant publishes
* a Fapp_bboard to make itself discoverable to diners
* 
*/ 

"use strict";

const { Fcrypto } = require("../fcrypto/fcrypto.js");

class Fapp_bboard {
  cred;
  img_cred_base64;
  form;
  sig;
  
  constructor({cred = null, img_cred_base64 = null, form = null, sig = null}  = {}) {
    if (!Array.isArray(form.data)) {
      throw new Error("form.data isn't an array - are you sure you're publishing a frozen form?");
    }

    // Generalization of a identity credential, most likely a Fid_pub object
    this.cred = cred; 
    // A base64 encoded image correlating your real world identity with the one named in cred
    this.img_cred_base64 = img_cred_base64; 
    // Generalization of a food menu
    this.form = form;
    // Cryptographic signature
    this.sig = sig;
  }

  // TODO: write a static method to safely validate size and dimensions of img_cred_base64

  // privkey as hex string
  static async sign(fapp_bboard, privkey) {
    fapp_bboard.sig = null;
    
    const sig = await Fcrypto.sign(
      Buffer.from(JSON.stringify(fapp_bboard)), 
      Buffer.from(privkey, "hex")
    );

    fapp_bboard.sig = sig.toString("hex");
    return fapp_bboard;
  }

  // pubkey as hex string
  static async verify(fapp_bboard, pubkey) {
    const copy = new Fapp_bboard(JSON.parse(JSON.stringify(fapp_bboard)));
    copy.sig = null;
    
    return await Fcrypto.verify(
      Buffer.from(JSON.stringify(copy)), 
      Buffer.from(pubkey, "hex"), 
      Buffer.from(fapp_bboard.sig, "hex")
    );
  }
}

module.exports.Fapp_bboard = Fapp_bboard;