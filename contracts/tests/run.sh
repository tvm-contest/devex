
#!/bin/bash

echo -e "START testing....\n"
echo -e "\nDeploying Service.."
sleep 5
./TestCreateService.exp
echo -e "\nGet Info Service.."
sleep 5
./TestGetInfoService.exp
echo -e "\nDeploy subscription.."
sleep 5
./TestDeploySubscription.exp
echo -e "\nShow subscription.."
sleep 5
./TestShowSubscriptions.exp
echo -e "\nPopup wallet 1 TON"
sleep 5
./TestPopupWallet
echo -e "\nDelete Service.."
sleep 5
./TestDeleteService.exp

echo -e "\nCompleted successfully."