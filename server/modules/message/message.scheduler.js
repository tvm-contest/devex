var CronJob = require('cron').CronJob;
const messsageManager = require('./message.manager');
const toolkit = require('./../libs/toolkit');
const axios = require('axios');

const configurationManager = require('../libs/configuration');

var job = new CronJob(configurationManager.SCHEDULE, async function() {
	
	console.log(`Running queue scheduler: ${configurationManager.SCHEDULE}`);
	const messagesForSending = await messsageManager.get({ isDelivered: false, isDeleted: false });

	messagesForSending.forEach(async (message) => {
		const url = message.callbackUrl
		const body = { nonce: message.nonce, encodedMessage: message.message}
		try{
			(url.startsWith('https://api.telegram.org') ? await axios.get(url) : await axios.post(url, body))
			
			await messsageManager.setPropery(message._id, { isDelivered: true })
			await messsageManager.delete(message._id);
			await messsageManager.setPropery(message._id, { lastError: "" })
		}
		catch(e){
			console.log(e.toString());
			await messsageManager.setPropery(message._id, { lastError: e.toString() })
		}
	})
}, null, true, 'America/Los_Angeles');

exports.module = job.start();