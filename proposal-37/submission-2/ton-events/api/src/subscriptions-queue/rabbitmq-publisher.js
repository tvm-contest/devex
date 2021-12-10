const debug = require('debug')('lib:rabbitmq-publisher');
const amqp = require('amqplib/callback_api');
const Async = require('async');
const _ = require('lodash');

class RMQPublisher {
    constructor(amqpUri) {
        this.amqpUri = amqpUri;
    }

    publish(exchange, rkey, msg, opts, cb) {
        Async.waterfall(
            [
                (cb) => {
                    if (this.connection) return cb();

                    return amqp.connect(this.amqpUri, (err, connection) => {
                        if (err) return cb(err);

                        this.connection = connection;

                        this.connection.on('error', (err) => {
                            debug(`ERROR: RMQPublisher: connection error occurred: ${err}`);
                        });
                        this.connection.on('close', (err) => {
                            debug(`WARN: RMQPublisher: connection closed: ${err}`);

                            this.connection = null;
                        });

                        return cb();
                    });
                },

                (cb) => {
                    if (this.channel) return cb();

                    if (_.isNil(this.connection))
                        return cb(new Error('connection isn\'t initialized'));

                    return this.connection.createChannel((err, channel) => {
                        if (err) return cb(err);

                        this.channel = channel;

                        this.channel.on('error', (err) => {
                            debug(`ERROR: RMQPublisher: channel error occurred: ${err}`);
                        });
                        this.channel.on('close', (err) => {
                            debug(`WARN: RMQPublisher: channel closed: ${err}`);

                            this.channel = null;
                        });

                        return cb();
                    });
                },

                (cb) => {
                    if (_.isNil(this.channel))
                        return cb(new Error('channel isn\'t initialized'));

                    if (exchange.name === '') return cb();

                    return this.channel.assertExchange(
                        exchange.name,
                        exchange.type,
                        exchange.opts,
                        _.ary(cb, 1)
                    );
                },

                (cb) => {
                    if (_.isNil(this.channel))
                        return cb(new Error('channel isn\'t initialized'));

                    this.channel.publish(exchange.name, rkey, msg, opts);

                    return cb();
                }
            ],
            cb
        );
    }
}

module.exports = RMQPublisher;

