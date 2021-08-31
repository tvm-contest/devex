
#!/bin/bash

echo -e "START testing....\n"
echo -e "\nDeploying Service.."
sleep 10
expect -f ./TestCreateService.exp
echo -e "\nGet Info Service.."
sleep 10
expect -f ./TestGetinfoService.exp
echo -e "\nDeploy subscription.."
sleep 10
expect -f ./TestDeploySubscription.exp
echo -e "\nShow subscription.."
sleep 10
expect -f ./TestShowSubscriptions.exp
echo -e "\nPopup wallet 1 TON"
sleep 10
expect -f ./TestPopupWallet.exp
echo -e "\nDelete Service.."
sleep 10
expect -f ./TestDeleteService.exp
echo -e "\nCompleted successfully."