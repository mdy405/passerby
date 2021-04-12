/** 
* FAPP_BBOARD
* FAPP_BBOARD (billboard) is to Free Food what torrents 
* are to BitTorrent: they are publicly shareable data 
* entities which describe a network resource (food)
* A restaurant publishes a Fapp_bboard to make itself 
* discoverable to diners
*/ 

"use strict";

class Fapp_bboard {
	cred;
	form;

	constructor({cred = null, form = null}  = {}) {
		if (!Array.isArray(form.data)) {
			throw new Error("form.data doesn't seem to be an array - are you sure you're publishing a frozen form?");
		}

		this.cred = cred; // Generalization of a signed cryptographic certificate
		this.form = form; // Generalization of a food menu
	}
}

module.exports.Fapp_bboard = Fapp_bboard;