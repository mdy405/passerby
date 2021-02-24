/** 
* HDLT_TSACT
* A single DLT transaction
* 
* 
*
*
*/ 

"use strict";

const { Hutil } = require("../hutil/hutil.js"); 

class Hdlt_tsact {
	static VERSION = {
		V1: 0x01
	};

	static ENCODER = new Map([
		[Hdlt_tsact.VERSION.V1, Hdlt_tsact._encoder_v1]
	]);

	static DECODER = new Map([
		[Hdlt_tsact.VERSION.V1, Hdlt_tsact._decoder_v1]
	]);

	utxo;
	lock;
	unlock;

	// utxo as hex string, lock and unlock as arrays
	constructor ({version = Hdlt_tsact.VERSION.V1, utxo, lock, unlock} = {}) {
		this.version = version;
		this.utxo = utxo;
		this.lock = lock;
		this.unlock = unlock;
	}

	static from(arr) {
		return Hdlt_tsact.DECODER.get(arr[0])(arr);
	}

	// Transactions are serialized as arrays
	static serialize(tsact) {
		// TODO: handle bad version
		return Hdlt_tsact.ENCODER.get(tsact.version)(tsact);
	}

	// V1 format: version (1 byte), utxo len (1 byte), utxo, lock len (1 byte), lock, unlock len (1 byte), unlock
	static _encoder_v1(tsact) {
		const utxo_buf = Buffer.from(tsact.utxo, "hex");
		return [].concat(Hdlt_tsact.VERSION.V1, utxo_buf.length, [...utxo_buf], tsact.lock.length, tsact.lock, tsact.unlock.length, tsact.unlock);
	}

	static _decoder_v1(arr) {
		const utxo_len = arr[1];
		const utxo_offset = 2;
		const lock_len = arr[utxo_offset + utxo_len];
		const lock_offset = utxo_offset + utxo_len + 1;
		const unlock_len = arr[lock_offset + lock_len];
		const unlock_offset = lock_offset + lock_len + 1;
		
		return new Hdlt_tsact({
			utxo: Buffer.from(arr.slice(2, 2 + arr[1]), "hex").toString("hex"),
			lock: [...arr.slice(lock_offset, lock_offset + lock_len)],
			unlock: [...arr.slice(unlock_offset, unlock_offset + unlock_len)]
		});
	}

	// Compute the SHA256 hash of a serialized transaction, returns a string
	static sha256(arr) {
		return Hutil._sha256(Buffer.from(arr).toString("hex"));
	}
}

module.exports.Hdlt_tsact = Hdlt_tsact;