# FreeTON Notification Service

FNS (FreeTON Notification Service) is a http service allows you to forward encrypted messages from FreeTON Network to http(s) web services and Telegram.

![image](https://user-images.githubusercontent.com/54890287/137313922-3345660c-b800-4512-a794-7bb206ae775c.png)

## Before usage / Requirements

Before start using FNS you need to have.

1. Serf wallet.

2. External web address for receiving messages. For testing enough to use services like https://webhook.site. Open https://webhook.site and press the link `https://webhook.site/0f0b0f73-11d8-4074-bd70-e03be5e19dee`. You will receive an external https address which could be used for testing later. Do not forget enable `CORS Headers`. It is very important for testing.

![image](https://user-images.githubusercontent.com/54890287/137189597-3c6219d6-1888-470e-a9f3-6d27f60a0444.png)

## How to use

1. Open Serf and log in using your credentials.

2. [Switch](https://help.ton.surf/ru-RU/support/solutions/articles/77000267280-%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%B0%D1%8F-%D0%B8-%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B0%D1%8F-%D1%81%D0%B5%D1%82%D0%B8-mainnet-devnet-) to Test Network and get some Ruby using https://faucet.extraton.io/. 

3. Open Debot using Debot Browser or [link](https://web.ton.surf/debot?address=0%3A433f7b97e4e613397175a2d9d1094643b5b90d1f095c423997f95fbf905a3ae3&net=devnet). After the siging two transactions you will see the menu.

![image](https://user-images.githubusercontent.com/54890287/134902058-b2459691-9aeb-437b-96cf-69d4db7f5342.png)

4. Press the button `Send callbackUrl | deviceToken to provider` and choose `github.com/nrukavkov/freeton-notification-service, ID = TNS` from the list. Then enter data to the provider. By default you can use two types: HTTP(S) or TELEGRAM. Example of usage: 
`https://webhook.site/0f0b0f73-11d8-4074-bd70-e03be5e19dee`
`telegram://someChatId`

![image](https://user-images.githubusercontent.com/54890287/137191104-88ea853e-9857-413f-82cf-aadb3b98fae1.png)

ℹ️ Before receiving messages to Telegram, you have to create Telegram Bot using [Bot Father](https://telegram.me/BotFather), save `Bot Token` and add your bot to the some channel. 

Open the `secret link` starts with `https://freeton-notification-service.voip-lab.ru/login/{your_secret_api_key}` and get an access to the private are where you can change your profile settings.

![image](https://user-images.githubusercontent.com/54890287/137192047-524d2d08-caf8-400d-ba21-3271860aed3f.png)

Also here you can see all messsages and status of delivery.

![image](https://user-images.githubusercontent.com/54890287/137192240-dcfd0c61-0039-4d75-afc9-ad8445872308.png)

If you want to get more detailed info just press the ➕ near the intrested message.

![image](https://user-images.githubusercontent.com/54890287/137192484-a8f6cd75-4c77-438b-bd3e-9757e0553c8c.png)

5. Then you need to `Set Rules` and follow the instruction received from Debot. At the first line you need to set up ID. In our case it will be generated `ID=TNS`. And the second line will be an address in blockchain and message type. Example of rules:

```
ID=TNS

# HERE YOU NEED TO USE YOUR OWN ADDRESS. IT IS JUST EXAMPLE.
0:392300ae37bdccb044a8e2ba13f9f3a2f966f26c53a776bc10706f2ed591487d all
```

ℹ️ For testing you can use your personal wallet address.

6. Final step try to send some Rubi to addreess you set before. A few seconds later you will get POST requests to your endpoint.  

![image](https://user-images.githubusercontent.com/54890287/135270524-f89214ce-360b-4113-8d7c-d9ab71682d6a.png)

## API

`POST` `/` - set new endpoint

`GET` `/endpoint` - return all available endpoints

`DELETE` `/endpoint:id` - delete endpoint with ID

`GET` `/message` - get all my messages

`DELETE` `/message/:id` - delete message with ID

## For Developers

The primary instance installed in Kubernetes Cluster. But you can start it locally using `docker-compose up --build` command. Required docker-compose and docker installed.

But you have to set some ENV variables. 

```
MONGODB_CONNECTION_STRING="mongodb://USERNAME:PASSWORD@HOST_OR_IP/DATABASE?authSource=admin"
SALT=CHANGE_ME
KAFKA_USERNAME=CHANGE_ME
KAFKA_PASSWORD=CHANGE_ME
KAFKA_MECHANISM=scram-sha-512
KAFKA_TOPIC=CHANGE_ME
```

### Deploy

We use HELM and WERF for deploying the application to kubernetes.To do it just use the command below

```werf converge --repo=ghcr.io/nrukavkov/freeton-notification-service```

### Local run

```werf run app --docker-options="-ti --rm -p 8000:8000```
