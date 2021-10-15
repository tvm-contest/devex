<div align="center">
  <img src="./images/icon.png" title="TON HTTP notification provider test server">
</div>

This project is part of HTTP notification provider for free TON blockchain. Test server allows confirming rights on callback urls, serves requests in simple manner.

# How to setup environment on pure server

1. Install Docker by this [instruction](https://docs.docker.com/engine/install/)
2. Install Docker compose by this [instruction](https://docs.docker.com/compose/install/)
3. Create `/opt/docker` folder
4. Copy `docker-nginx` from this repository to the `/opt/docker` folder
5. Create own subdomain for `DNS` verification way testing
6. Adjust /opt/docker/docker-nginx/config/nginx/sites-enabled/test-dns-nph
7. Create own subdomain for `file` verification way testing
8. Adjust /opt/docker/docker-nginx/config/nginx/sites-enabled/test-file-nph
9. Create own subdomain for `metatag` verification way testing
10. Adjust /opt/docker/docker-nginx/config/nginx/sites-enabled/test-metatag-nph
11. Run `docker-compose up`
12. Install [golang](https://golang.org/dl/)

# How to use

1. Create new domain name. For example, to test `File` verification way: https://test-file-nph.mytonwallet.com/
2. Run notification DeBot and enter callback URL: https://test-file-nph.mytonwallet.com/callback_url
3. Follow by instruction that will be shown from the HTTP provider
4. Obtain secret phrase from the virification process on HTTP provider side
5. Copy this repository to the `/opt/http-provider-test` folder
6. Adjust files `file.sh` for appropriated verification methods
7. Run needed server version. For example `file.sh` to test verification way that based on a file.
8. As soon as the verification process will be passed, you can send message, that appropriate your rules to blockchain
9. To check that message is received on callback URL check the page https://test-file-nph.mytonwallet.com/log

The same steps can be performed for testing `dns` and `metatag` verification ways

By default `test-dns-nph` nginx config will listen: `3001` port
By default `test-file-nph` nginx config will listen: `3002` port
By default `test-metatag-nph` nginx config will listen: `3003` port

All sh scripts run golang application by command:
```console
go run app.go
```

Also, you can find useful to build standalone application by `build.sh`/`build.cmd` scripts, then you need to adjust `.sh` scripts

For convenience we have created already confirmed callback URLs:
* for `file` verification way: https://test-file-nph.mytonwallet.com/
* for `dns` verification way: https://test-dns-nph.mytonwallet.com/
* for `metatag` verification way: https://test-metatag-nph.mytonwallet.com/

Environment variables:
`PORT="3001"` - test server will listen this port
`VERIFICATION_TYPE="File"` - which verification way needs to test
`export SECRET="3aa5fd4d000a3e0dcac9b38e992747c0"` - a secret phrase that will be received during verification process
`export QUERY="param"` - which parameter will contain incoming message

*Keep in mind*

* Any test-server that runs in console will be stopped as soon you will close the console. To avoid this aftermath, you can use `nohup` command for *nix or `Start-Job` for Windows.
* Test server can accept GET/POST/PUT/PATCH requests.

# Build with docker and use as standalone applications 

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

All files will be placed in `./build` folder

# Contributing / Issues / Requests

For ideas, issues, additions, modifications please raise an issue or a pull request at https://github.com/mytonwallet/ton-http-notification-provider-test-serer