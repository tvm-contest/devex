var CronJob = require('cron').CronJob;
const messsageManager = require('./message.manager');
const toolkit = require('./../libs/toolkit');
const axios = require('axios');

const configurationManager = require('../libs/configuration');

var job = new CronJob(configurationManager.SCHEDULE, async function() {
	
	console.log(`Running queue scheduler: ${configurationManager.SCHEDULE}`);
	const messagesForSending = await messsageManager.get({ isDelivered: false, isDeleted: false });

	messagesForSending.forEach(async (message) => {
			if(typeof message.endpoint !== "undefined" ){
				const url = message.endpoint.url
				const body = { nonce: message.nonce, encodedMessage: message.message}
				try{
					console.log(`Post request to ${url} with body ${body}`)
					await axios.post(url, body);
					await messsageManager.setPropery(message._id, { isDelivered: true })
					await messsageManager.delete(message._id);
					await messsageManager.setPropery(message._id, { lastError: "" })
				}
				catch(e){
					console.log(e.toString());
					await messsageManager.setPropery(message._id, { lastError: e.toString() })
				}
			}
			else{
				const errorMessage = `Could not find customer's url.`
				console.log(`${errorMessage} The message ${message._id} will be deleted`)
				await messsageManager.delete(message._id);
				await messsageManager.setPropery(message._id, { lastError: errorMessage })
			}
		}
	)
}, null, true, 'America/Los_Angeles');

exports.module = job.start();