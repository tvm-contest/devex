const mongoose = require("mongoose");

const message = new mongoose.Schema({
	"hash": {
		type: String,
	},
	"nonce": {
		type: String,
	},
	"message": {
		type: String,
	},
	"isDelivered": {
		type: Boolean,
		default: false
	},
	"isDeleted": {
		type: Boolean,
		default: false
	},
	"lastError": {
		type: String,
		default: ""
	},
},
{ toJSON: { virtuals: true }, timestamps: true });

message.virtual("endpoint", {
	ref: "endpoint",
	localField: "hash",
	foreignField: "hash",
	justOne: true,
});

module.exports = mongoose.model( "message", message, "message");
