<div align="center">
  <img src="./images/logo.png" title="Free TON http notification service">
</div>

This project is `HTTP notification provider` for free TON blockchain. It allows subscribing on message/events on blockchain through DeBot interface.

# Environment variables

You have to use `.env` file or set up from console:

| Name      | Mandatory |  Default  | Description  |
| --------- | --------- |---------  | -----------  |
| PORT      | no        | 3000      |  Which port will use the server   |
| KAFKA_URL  | yes       |  | Url for a connection to Kafka |
| KAFKA_LOGIN  | yes       |  | Login for a connection to Kafka |
| KAFKA_PASSWORD  | yes       |  | Password for a connection to Kafka |
| KAFKA_TOPIC  | yes       |  |  Topic on Kafka to track messages |
| VERIFICATION_PERIOD_AFTER  | no       | 5 |  How long to wait in minutes before 1st attempt of verification process |
| VERIFICATION_PERIOD_RETRY  | no       | 45000000000 | After what period in nanoseconds need to retry a verification process|
| MESSAGE_SENDING_PERIOD_RETRY  | no       | 45000000000 | After what period in nanoseconds need to retry send message again |
| MESSAGE_SENDING_RETRY_BACKOFF  | no       | "exponential" | Which way to use for calculating the time of the next sending attempt. Possible values: exponential and constant |
| MESSAGE_SENDING_MAX_RETRY  | no       | 10 | How many attempts on delivery |
| CRON_SCHEDULE_CLEAR_DB  | no       |  | To clear database from old messages, possible to set up schedule by cron syntax |

# API

**Add new callback URL**
----
  Send new callback URL to http provider

* **URL**

  /

* **Method:**
  
  `POST`
  
*  **URL Params**

   No

* **Data Params**

  **Required:**
 
  `hash=[string]`

  **Required:**
 
  `data=[string]`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Your id is 1. You need to confirm your rights for this endpoint. Please, follow to the https://nph.mytonwallet.com/verify/1 to pass verification procedure.`
 
* **Error Response:**

  * **Code:** 200 <br />
    **Content:** `You must specify url. Format: URL Method Query`

  OR

  * **Code:** 200 <br />
    **Content:** `Callback URL is not valid`

  OR

  * **Code:** 200 <br />
    **Content:** `Callback URL scheme is not valid. Only http:// or https://`

  OR

  * **Code:** 200 <br />
    **Content:** `Callback URL host is not working domain or IP address`

  OR

  * **Code:** 502 <br />
    **Content:** `Repeat your request later`

**Get information by id**
----
  Get information by id (this id pepresents callback URL)

* **URL**

  /get/:id

* **Method:**
  
  `GET`
  
*  **URL Params**

   **Required:**
 
  `id=[int]`

* **Data Params**

   **Optional:**
  `json=1`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Html page with information or json if was called with json=1 query`
 
* **Error Response:**

  * **Code:** 400 <br />
    **Content:** `You must specify id`

  OR

  * **Code:** 502 <br />
    **Content:** `Repeat your request later`

  OR

  * **Code:** 404 <br />
    **Content:** `Id is not existed`

**Select verification way for id**
----
  Form to select verification way by id (this id pepresents callback URL)

* **URL**

  /verify/:id

* **Method:**
  
  `GET`
  
*  **URL Params**

   **Required:**
 
  `id=[int]`

* **Data Params**

   No

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Html page with form to select verification way - DNS, File, Metatag`
 
* **Error Response:**

  * **Code:** 400 <br />
    **Content:** `You must specify id`

  OR

  * **Code:** 404 <br />
    **Content:** `This id is not created yet`

  OR

  * **Code:** 502 <br />
    **Content:** `Repeat your request later`

**Set verification way for id**
----
  Set verification way for id (this id pepresents callback URL)

* **URL**

  /verification_way/:id

* **Method:**
  
  `POST`
  
*  **URL Params**

   **Required:**
 
  `id=[int]`

* **Data Params**

   **Required:**
 
  `verification_way=[string]`

  Possible values - DNS, File, Metatag. By default File

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Ok`
 
* **Error Response:**

  * **Code:** 400 <br />
    **Content:** `You must specify id`

  OR

  * **Code:** 502 <br />
    **Content:** `Repeat your request later`

  OR

  * **Code:** 404 <br />
    **Content:** `Domain is confirmed already`

**Instructions of verification way for id**
----
  Page with description how to pass verification process by id (this id pepresents callback URL)

* **URL**

  /verification_way/:id

* **Method:**
  
  `GET`
  
*  **URL Params**

   **Required:**
 
  `id=[int]`

* **Data Params**

   No

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `Html page with instructions for selected verification way`
 
* **Error Response:**

  * **Code:** 400 <br />
    **Content:** `You must specify id`

  OR

  * **Code:** 502 <br />
    **Content:** `Repeat your request later`

  OR

  * **Code:** 404 <br />
    **Content:** `This id is not created yet`

  OR

  * **Code:** 404 <br />
    **Content:** `Domain is confirmed already`

# Architecture

<div align="center">
  <img src="./images/http-provider-logic.png" title="Free TON http notification service logic">
</div>

Tech stack:

* Golang
* Sqlite3
* Docker
* Supervisor

# UI

A consumer must use a DeBot that will send an information to the HTTP notification provider. After this step, the user will be able to use the UI flow to verify the endpoint in a friendly manner.
To customize the UI needs to change HTML templates in folder `./templates`

These templates currently are available:

* index.html - the main page
* callbackURL_info.html - the page which shows information about callback URL by id
* verification_DNS.html - the page which shows information for DNS verification way
* verification_File.html - the page which shows information for File verification way
* verification_Metatag.html - the page which shows information for Metatag verification way
* verification_way.html - the page which shows form for selecting verification way

# Build with docker (cross-platform compilation)

On Windows to build for Linux amd64:

```console
.\build.cmd
> Enter Value (darwin/amd64,windows/amd64,linux/amd64,linux/arm): linux/amd64
>linux/amd64
```

On Linux to build for Windows:

```console
.\build.sh
> Enter Value (darwin/amd64,windows/amd64,linux/amd64,linux/arm): linux/amd64
>windows/amd64
```

All files will be placed in `./build` folder.

Also, you can run by `go run app.go` if golang is installed on your environment

# Testing

It is possible to perform local tests by running:

```golang
go test
```

Also usefull to test via special utility. You can find it in this [repository](https://github.com/mytonwallet/ton-http-notification-provider-test-server). The tool allows to log all events on the callback URI in a simple manner

# Optimal time delivery repeating
Below the algorithm of optimal delivery time

```js
let maxAttempt = 10;
let totalPeriod = 0;
let minutes = 0.75;
let attempts = [];
for (var i = 1; i <= maxAttempt; i++) {
  totalPeriod += minutes*2**i;
  attempts.push(minutes*(2**i)/60 + "hr");
}
console.log("Total period in hours: " + totalPeriod/60, " delivery time points: " + attempts.join(","));

> Total period in hours: 25.575 delivery time points: 0.025hr, 0.05hr, 0.1hr, 0.2hr, 0.4hr, 0.8hr, 1.6hr, 3.2hr, 6.4hr, 12.8hr
```
It means that the optimal time during 24 hrs is equal an attempt to send after period of 45 seconds increasing 10 times by exponent (2**AttemptCounter).

# Production docker container

It is usefull to use the container that placed in `./docker` for production. It contains *supervisor* tool that can garantee fault tolerance, log rotation, etc.

To use it:
1. Copy `./docker ` folder to `/opt` on your host
2. Build `app` for your host. See instructions above in "Build with docker" section.
3. Copy `./build ` folder to `/opt/docker/build` on your host
4. Don't forget to setup `chmod +x` for `/opt/docker/build/ton-http-notification-provider`
5. Install Docker by this [instruction](https://docs.docker.com/engine/install/) 
6. Install Docker compose by this [instruction](https://docs.docker.com/compose/install/)
7. Adjust settings in `http-provider.conf` and `docker-compose.yml` if need it
8. Run in console `docker-compose up -d`
9. Server will start listen port *3000*
10. Install `nginx` as proxy-server if you need it. It worths to check docker nginx container [here](https://github.com/mytonwallet/ton-http-notification-provider-test-server) to get some inspiration
11. Standard `stdout` and `stderr` channels will be redirected to `/opt/docker/logs/supervisor/http-provider.log`
12. [Configure Docker to start on boot](https://docs.docker.com/engine/install/linux-postinstall/#configure-docker-to-start-on-boot)

*Keep in mind*

Container size is around `405 MB on disk` and consume around `265 MB memory`

As alternative way, you can install all on fresh hosting by yourself - golang, supervisor, application

Pure size for the application is around `20 MB on disk` and `7MB memory`

# Defend from message losing

Retry logic on every step.

*Low level:*

Defend from OS losing, when database is locked, etc.

*High level:*

If some error is happened, then will be retry by two different ways till max retry count will be reached:

* Constant time
* Exponential time (by default)

If for some reason tasks will be frozen in a "working" state, for example, due to deployment of a new version, in this case on start all of them will become in the "waiting" state. This feature will allow repeating the last unfinished events.

*Docker level:*

* Defense of service shutdown is realized in docker container with supervisor service. This service monitors stae of aplication and restart when it shutdowns. Also, it usefull for new version deployment. Just need to replace application file and make a supervisor restart.

* Need to run docker container with parameter `--restart always`. It means that container will be running all time.

*OS level:*

Need to set up autostart for docker service after reboot. Additional information places [here](https://docs.docker.com/engine/install/linux-postinstall/#configure-docker-to-start-on-boot)

# Criteria for delivered messages

Due to the HTTP protocol nature, all codes 20x will be meant as a successful delivery.
Any other code will invoke the message sending repeating.

* 200 OK
* 201 Created
* 202 Accepted
* 203 Non-Authoritative Information (since HTTP/1.1)
* 204 No Content
* 205 Reset Content
* 206 Partial Content (RFC 7233)
* 207 Multi-Status (WebDAV; RFC 4918)
* 208 Already Reported (WebDAV; RFC 5842)
* 226 IM Used (RFC 3229)

# Clean database

It is possible to delete delivered messages and successful queued  tasks by cron schedule. Just need to specify `CRON_SCHEDULE_CLEAR_DB` variable.

# Performance

Up to 15K/s message sending throughput on 4CPU/6Gb memory per instance.

The app consume only 7Mb in idle mode.

Performance can adjust by setting concurrency for workers. They will work in goroutines.

Cron can clear DB from old messages and history in regular mode.

# Remove callback URL

In the current version is not supported. Need to have incoming data from Debot.

# Features request

* [ ] Create simple payment system example. This module will take keys on input, then decrypt message and form the right response about received payment.

# Contributing / Issues / Requests

For ideas, issues, additions, modifications please raise an issue or a pull request at https://github.com/mytonwallet/ton-http-notification-provider