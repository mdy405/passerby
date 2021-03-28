/** 
* HID_PUB
* A HID_PUB is the public half of our identity system
* It encapsulates identity info about a peer that's
* safe to share, and it enforces primitive types
* so that it's easy to serialize
*
*/ 

"use strict";

const { Hutil } = require("../hutil/hutil.js");

class Hid_pub {
	pubkey;
	name;
	first;
	last;
	address;
	phone;
	lat;
	long;
	peer_id;
	nonce;

	constructor({pubkey = null, peer_id = null, name = null, first = null, last = null, address = null, phone = null, lat = null, long = null}  = {}) {
		// TODO: validation, enforce primitive types

		this.pubkey = pubkey;
		this.name = name; // TODO: name is for restaurants, where first/last are for people. Too complex?
		this.first = first;
		this.last = last;
		this.address = address;
		this.phone = phone;
		this.lat = lat;
		this.long = long;
		this.peer_id = peer_id;
		this.nonce = "00"; // Need two digits for Buffer to parse correctly
	}

	static inc_nonce(hid_pub) {
		const unpad = (parseInt(hid_pub.nonce, 16) + 1).toString(16);
		hid_pub.nonce = unpad.padStart(unpad.length + (unpad.length % 2), "0");
	}
}

module.exports.Hid_pub = Hid_pub;