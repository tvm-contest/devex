var CronJob = require('cron').CronJob;
const queueManager = require('./queueManager');
const callBackManager = require('./callbackManager');
const axios = require('axios');

const configurationManager = require('./configurationManager');

var job = new CronJob(configurationManager.SCHEDULE, async function() {
	
	console.log(`Running queue scheduler: ${configurationManager.SCHEDULE}`);
	const queue = await queueManager.all()
	
	for (const [key, value] of Object.entries(queue)) {
		const messageArray = value.split(" ");
		if(messageArray.length === 3){
			const customerId = messageArray[0];

			const body = {
				nonce: messageArray[1],
				encodedMessage: messageArray[2],
			}

			if(urlBase64 = await callBackManager.get(customerId))
			{
				const buff = Buffer.from(urlBase64, 'base64');
				const url = buff.toString('utf-8');
	
				try{
					await axios.post(url, body);
				}
				catch(e){
					console.log(e);
				}
				await queueManager.delete(key);
			}
			else{
				console.log(`Could not find customer's url. The message ${key} will be deleted`)
				await queueManager.delete(key);
			}

		}
	}

}, null, true, 'America/Los_Angeles');

exports.module = job.start();