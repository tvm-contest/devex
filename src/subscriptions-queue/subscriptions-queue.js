const debug = require('debug')('lib:subscriptions-queue');
const Async = require('async');
const _ = require('lodash');

const RMQPublisher = require('./rabbitmq-publisher');

class SubscriptionsQueue {
    constructor(rmqPublisher) {
        this.queue = Async.queue(({ exchange, rkey, body, opts }, cb) => {
            if (_.isEmpty(body)) {
                return cb(new Error('message body is empty'));
            }

            const task = (cb) => rmqPublisher.publish(
                exchange,
                rkey,
                Buffer.from(body),
                opts,
                cb
            );

            return Async.retry({ interval: 3333, times: 3 }, task, cb);
        });

        this.queue.error((err) => {
            debug(`ERROR: SubscriptionsQueue: task processing failed: ${err}`);
        });
    }

    push(msg) {
        this.queue.push(_.defaultsDeep(msg, {
            exchange: {
                name: '',
                type: 'direct',
                opts: { durable: true }
            },
            rkey: 'ton.events.control',
            opts: {}
        }));
    }

    static build(amqpUri) {
        return new SubscriptionsQueue(new RMQPublisher(amqpUri));
    }
}

module.exports = SubscriptionsQueue;

