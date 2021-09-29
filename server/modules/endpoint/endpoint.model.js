const mongoose = require("mongoose");

const endpoint = new mongoose.Schema(	
	{
		"hash": {
			type: String,
		},
		"url": {
			type: String,
		}
	},
	{
		timestamps: true,
	});

endpoint.index( { hash: 1 } , { unique: true });
module.exports = mongoose.model( "endpoint", endpoint, "endpoint");
