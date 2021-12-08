# collectible-smartcontracts
Collectible NFTs smartcontracts

### Compile smartcontracts
>tondev sol compile CollectionRoot.sol

>tondev sol compile Collection.sol

>tondev sol compile CollectionToken.sol

### Wrap smartcontracts
>tondev js wrap CollectionRoot.abi.json 

>tondev js wrap Collection.abi.json

>tondev js wrap CollectionToken.abi.json

### Deploy CollectionRoot contract
1. Go to deploy folder
2. Set your msig address to `address` variable 
3. Rename `msig_keys.js` to `msig.keys.js` and set your msig keys
4. Run `node index.js`

### Compile DeBot
> tondev sol compile NiFiDebot.sol

### Deploy DeBot
> tonos-cli deploy NiFiDebot.tvc "{}" --sign NiFiDebot.keys.json --abi NiFiDebot.abi.json
> 
> tonos-cli call <ADDRESS> setABI "{\"dabi\":\"<ABI>\"}" --sign NiFiDebot.keys.json --abi NiFiDebot.abi.json
  
> tonos-cli call <ADDRESS> setRoot "{\"addr\":\"<ROOT>\"}" --sign NiFiDebot.keys.json --abi NiFiDebot.abi.json
