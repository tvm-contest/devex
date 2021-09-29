# FreeTON Notification Service

FNS (FreeTON Notification Service) is a http service allows you to forward encrypted messages from FreeTON Network to http(s) web services.

## Before usage / Requirements

Before start using FNS you need to have.

1. Serf wallet.

2. External web address for receiving messages. For testing enough to use services like https://webhook.site. Open https://webhook.site and press the link `https://webhook.site/0f0b0f73-11d8-4074-bd70-e03be5e19dee`. You will receive an external https address which could be used for testing later.

![image](https://user-images.githubusercontent.com/54890287/135270162-3b96944e-3dcc-4ba8-94d3-e83c27e4ed9d.png)

## How to use

1. Open Serf and log in using your credentials.

2. [Switch](https://help.ton.surf/ru-RU/support/solutions/articles/77000267280-%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%B0%D1%8F-%D0%B8-%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B0%D1%8F-%D1%81%D0%B5%D1%82%D0%B8-mainnet-devnet-) to Test Network and get some Ruby using https://faucet.extraton.io/. 

3. Open Debot using Debot Browser or [link](https://web.ton.surf/debot?address=0%3A433f7b97e4e613397175a2d9d1094643b5b90d1f095c423997f95fbf905a3ae3&net=devnet). After the siging two transactions you will see the menu.

![image](https://user-images.githubusercontent.com/54890287/134902058-b2459691-9aeb-437b-96cf-69d4db7f5342.png)

4. Press the button `Send callbackUrl | deviceToken to provider` and choose `github.com/nrukavkov/freeton-notification-service, ID = TNS` from the list. Then enter data to the provider. Here you need to use your own external web address. If you created an external link using **hookbin** just paste the Url received before. This will be looked like `https://hookbin.com/E7lOm0O89ksVjY66jYoO`

5. Press the button `Set Rules` and follow the instruction received from Debot. At the first line you need to set up ID. In our case it will be generated `ID=TNS`. And the second line will be an address in blockchain and message type. Final example

```
ID=TNS

# HERE YOU NEED TO USE YOUR OWN ADDRESS. IT IS JUST EXAMPLE.
0:392300ae37bdccb044a8e2ba13f9f3a2f966f26c53a776bc10706f2ed591487d all
```

6. Final step try to send some Rubi to addreess you set before. A few seconds later you will get POST requests to your endpoint.  

![image](https://user-images.githubusercontent.com/54890287/135270524-f89214ce-360b-4113-8d7c-d9ab71682d6a.png)

## For Developers

The primary instance installed in Kubernetes Cluster.

### Deploy

We use HELM and WERF for deploying the application to kubernetes.To do it just use the command below

```werf converge --repo=ghcr.io/nrukavkov/freeton-notification-service```

### Local run

```werf run app --docker-options="-ti --rm -p 8000:8000```
