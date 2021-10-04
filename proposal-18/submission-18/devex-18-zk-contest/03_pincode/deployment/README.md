# Deployment of use case: Recoverable Pubkeys with Pincodes

This directory contains a deployment of a PubkeyRecovery contract on the
testnet network deployed by the Nil Foundation at
https://net.freeton.nil.foundation/

The PubkeyRecovery contract is deployed at address:

```
0:7df38b1ba52798ee15118a0f8697e90c2bed6ebea141b2dacc0975e2d2e2f7ec
```

The passphrase is: `Best Passphrase Ever` (without the quotes)

For simplicity, the provkey.bin and verifkey.bin are available in the
current directory.

For testing, the user can generate a proof with, if his pubkey is stored in
hexa in a file 'my-pubkey.hex':

```
../cpp/pincode-client prove "Best Passphrase Ever" "$(cat my-pubkey.hex)"
```

The C++ client verifies that the proof is correct, but it is also possible
to check it using the NilFoundation version of 'tonos-cli':

```
tonos-cli --url https://net.freeton.nil.foundation/ run 0:7df38b1ba52798ee15118a0f8697e90c2bed6ebea141b2dacc0975e2d2e2f7ec vergrth16 "{ \"value\": \"$(cat big_proof.bin.hex)\" }" --abi ../contracts/PubkeyRecovery.abi.json
```

or through 'ft':

```
ft account create pincode_account --contract PubkeyRecovery --address 0:7df38b1ba52798ee15118a0f8697e90c2bed6ebea141b2dacc0975e2d2e2f7ec 

ft call --local pincode_account vergrth16 '{ "value": "%{file:big_proof.bin.hex}" }'
```

It is also possible to activate the new pubkey:

```
tonos-cli --url https://net.freeton.nil.foundation/ call 0:7df38b1ba52798ee15118a0f8697e90c2bed6ebea141b2dacc0975e2d2e2f7ec SetFromPincode "{ \"proof\": \"$(cat proof.bin.hex)\", \"newkey\": \"0x$(cat my-pubkey.hex)\" }" --abi ../contracts/PubkeyRecovery.abi.json
```

or through 'ft':

```
ft call pincode_account SetFromPincode '{ "proof": "%{file:proof.bin.hex}", "newkey": "%{file:my-pubkey.hex}" }'
```



