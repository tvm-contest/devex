const mongoose = require("mongoose");

const telegram = new mongoose.Schema(
	{
		"apiKey": {
			type: String,
		},
		"сhatId": {
			type: String,
		},
	}
);

const endpoint = new mongoose.Schema(	
	{
		"hash": {
			type: String,
		},
		"secret":{
			type: String,
		},
		"callbackUrl": {
			type: String,
		},
		"telegram": {
			type: telegram,
		},
		"admin": {
			type: Boolean,
			default: false
		},
	},
	{
		timestamps: true,
	});

endpoint.index( { hash: 1 } , { unique: true });
module.exports = mongoose.model( "endpoint", endpoint, "endpoint");
