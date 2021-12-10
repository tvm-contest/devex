const debug = require('debug')('api');
const _ = require('lodash');
const { isURL } = require('validator');
const crypto = require('crypto');
const got = require('got');
const express = require('express');
const router = express.Router();

const SubscriptionsQueue = require('../subscriptions-queue');

const subscriptionsQueue = SubscriptionsQueue.build(
    _.defaultTo(process.env.AMQP_URI, 'amqp://rabbitmq.ton.events'));

function printReqInfo(req) {
    debug(`${req.protocol}://${req.get('host')}${req.originalUrl}`,
        JSON.stringify(_.pick(req, ['body', 'headers']), null, 2));
}

function buildMsg(body) {
    return {
        opts: {
            // correlationId: "..."
        },
        body
    }
}

function validateCallbackURL(url) {
    try {
        return isURL(url, {
            protocols: ['http', 'https'],
            require_tld: false,
            require_protocol: true,
            require_host: true,
            require_port: false,
            require_valid_protocol: true,
            allow_underscores: true,
            host_whitelist: false,
            host_blacklist: false,
            allow_trailing_dot: false,
            allow_protocol_relative_urls: false,
            allow_fragments: true,
            allow_query_components: true,
            disallow_auth: false,
            validate_length: true
        });
    }
    catch (err) {
        return false;
    }
}

router.get('/', (req, res) => {
    res.render('index', { title: 'ton.events' });
});

router.get('/about', (req, res) => {
    res.json({
        name: 'ton.events',
        description: 'HTTP Notifications Provider for the Free TON Network',
        logo: 'https://ton.events/images/logo.png',
        contact: 'https://t.me/tonevents',
        github: 'https://github.com/ton-events'
    });
});

const DEFAULT_CRC_SALT = '446f6e277420796f75206675636b696e672069676e6f72652073616665747921';

/*
 * This one defines CRS retry policy.
 *
 * Default settings are:
 * - 5 attempts overall with 15s timeout each
 * - exponential backoff, i.e. delay between attempts,
 *   starting from 30s and doubled each time
 */
async function performChallengeResponseCheck(url, secret) {
    const crcToken = crypto.randomBytes(12).toString('base64');
    const crcRetryLimit = _.defaultTo(process.env.CRC_RETRY_LIMIT, 4);
    const crcRetryInitDelay = _.defaultTo(process.env.CRC_RETRY_INIT_DELAY, 30000);
    const res = await got(url, {
        throwHttpErrors: false,
        timeout: 15000,
        retry: {
            limit: crcRetryLimit,
            calculateDelay: ({ attemptCount, error, computedValue }) => {
                if (computedValue === 0) {
                    return 0;
                }

                debug(`WARN: CRC attempt #${attemptCount} for [${url}] failed with error ${error}`);

                return crcRetryInitDelay * Math.pow(2, attemptCount - 1) + Math.random() * 1000;
            }
        },
        searchParams: { crc_token: crcToken }
    });

    if (res.statusCode !== 200) {
        throw new Error(`unexpected status code (${res.statusCode})`);
    }

    const hmac = crypto.createHmac('sha256', secret);

    hmac.update(crcToken);

    const crcTokenSigned = hmac.digest('hex');

    if (res.body !== crcTokenSigned) {
        throw new Error(`token signature check failed ("${res.body}" !== "${crcTokenSigned}")`);
    }
}

router.post('/api/v1/subscribe', async (req, res) => {
    printReqInfo(req);

    const url = Buffer.from(req.body.data, 'base64').toString('utf8');

    if (!validateCallbackURL(url)) {
        return res.status(400).json('URL validation failed. Hint: protocol (http/https) is required.');
    }

    const secret = crypto.scryptSync(
        Buffer.from(req.body.hash, 'hex'),
        Buffer.from(_.defaultTo(process.env.CRC_SALT, DEFAULT_CRC_SALT), 'hex'),
        32);
    const response = { secret: secret.toString('hex') }

    res.status(202).json(response);

    try {
        await performChallengeResponseCheck(url, secret);
    }
    catch (err) {
        return debug('WARN: CRC failed:', err.message);
    }

    const msg = _
        .chain(req.body)
        .thru(({ hash, data }) => [
            hash,
            Math.floor(Date.now() / 1000),
            "add-subscription",
            data,
            response.secret
        ])
        .join(',')
        .thru(buildMsg)
        .value();

    return subscriptionsQueue.push(msg);
});

module.exports = router;

