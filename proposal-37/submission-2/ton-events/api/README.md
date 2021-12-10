# HTTP Notifications Provider Web API

## How to start receiving notifications

Callback registration process ends with a _secret_ being returned to the Client. After that, a Challenge-Response Check (CRC) will be performed.

A `GET` request will be sent to the callback URL with a query string, containing parameter called `crc_token`. In response, the Client must send that token signed with the _secret_ using _HMAC-SHA256_ algorithm.

Here goes a sample Node.js code that prepares the response:
```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'));

hmac.update(crc_token);

const response = hmac.digest('hex'); // that's important to encode response as HEX
```

Replying with correctly signed token and status code 200 will enable notifications being sent to the Client.

Additionally, each notification contains `x-te-signature` header set to the _HMAC-SHA256_ signature of its body prepended with `hmacsha256=` string. That header is there for the Client to make sure notfications are coming from the one and only [ton.events](https://ton.events) and for integrity checks, of course.
