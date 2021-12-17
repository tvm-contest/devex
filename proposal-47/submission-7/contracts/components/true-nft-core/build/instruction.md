# Generate addr and key
tonos-cli genaddr uploadDeGeneratice.tvc uploadDeGenerative.abi.json --genkey main.keys.json
# Deploy uploadDeGenerative
tonos-cli --url net.ton.dev deploy uploadDeGeneratice.tvc "{}" --sign main.keys.json --abi uploadDeGenerative.abi.json
# Deploy true nft 
tonos-cli --url net.ton.dev deploy NftRoot.tvc --data "{_addrOwner:'address of uploadDeGenerative',_name:'YourNameInHex'}" "{codeIndex:'',codeData:'',pay:123,koef:123}" --sign main.keys.json --abi NftRoot.abi.json
# Upload metadata 
tonos-cli --url net.ton.dev call ADDRESSOFDEGENERATIVE sendMetadata "{\"adr\":\"address of true nft\",\"metadata\":\"metadata bytes\"}" --sign main.keys.json --abi uploadDeGenerative.abi.json

# Finish 
tonos-cli --url net.ton.dev call ADDRESSOFDEGENERATIVE startSelling "{\"adr\":\"address of true nft\"}" --sign main.keys.json --abi uploadDeGenerative.abi.json

# And now any body can mint nft with special sum if they want