
#!/bin/bash

echo -e "START testing....\n"
echo -e "\nDeploying Service.."
sleep 5
expect -f ./TestCreateService.exp
echo -e "\nGet Info Service.."
sleep 5
expect -f ./TestGetInfoService.exp
echo -e "\nDeploy subscription.."
sleep 5
expect -f ./TestDeploySubscription.exp
echo -e "\nShow subscription.."
sleep 5
expect -f ./TestShowSubscriptions.exp
echo -e "\nPopup wallet 1 TON"
sleep 5
expect -f ./TestPopupWallet.exp
echo -e "\nDelete Service.."
sleep 5
expect -f ./TestDeleteService.exp
echo -e "\nCompleted successfully."