# FreeTON Notification Service

FNS (FreeTON Notification Service) is a http service allows you to forward encrypted messages from FreeTON Network to http(s) web services.

## Before usage / Requirements

Before start using FNS you need to have.

1. Serf wallet.

2. External web address for receiving messages. For example, https://myshop.com.

## How to use

1. Open Serf and log in using your credentials.

2. Switch to Test Network and get some Ruby using https://faucet.extraton.io/.

3. Open Debot Browser and open Debot https://web.ton.surf/debot?address=0%3A433f7b97e4e613397175a2d9d1094643b5b90d1f095c423997f95fbf905a3ae3&net=devnet.

4. Press the button `Send callbackUrl | deviceToken to provider` and choose `github.com/nrukavkov/freeton-notification-service, ID = TNS` from the list. Then enter data to the provider. Here you need to use your own external web address.

5. Press the button `Set Rules` and follow the instruction. At the first line you need to set up ID. In our case it will be generated `ID=TNS`. And the second line will be an address in blockchain and message type. Final example

```ID=TNS

0:392300ae37bdccb044a8e2ba13f9f3a2f966f26c53a776bc10706f2ed591487d all
```

## For Developers

The primary instance installed in Kubernetes Cluster.

### Deploy

We use HELM and WERF for deploying the application to kubernetes.To do it just use the command below

```werf converge --repo=ghcr.io/nrukavkov/freeton-notification-service```

### Local run

```werf run app --docker-options="-ti --rm -p 8080:8080```