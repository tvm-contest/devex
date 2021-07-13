all: contracts checks

SIBLING_DIR=../../02_euler/contracts

checks:
	diff Blueprint.sol ${SIBLING_DIR}/Blueprint.sol
	diff RecoverablePubkey.sol ${SIBLING_DIR}/RecoverablePubkey.sol
	diff IRecoverablePubkey.sol ${SIBLING_DIR}/IRecoverablePubkey.sol
	diff RecoverablePubkey.sol.gen ${SIBLING_DIR}/RecoverablePubkey.sol.gen

contracts: PubkeyRecovery.code RecoverableMultisigWallet.code

PubkeyRecovery.code: *.sol
	ft contract build PubkeyRecovery.sol -f

RecoverableMultisigWallet.code: *.sol PubkeyRecovery.code
	ft output --file RecoverablePubkey.sol -o RecoverablePubkey.sol.gen
	ft contract build RecoverableMultisigWallet.sol -f
	cp -f RecoverablePubkey.sol ../../02_euler/contracts/
	cp -f RecoverablePubkey.sol.gen ../../02_euler/contracts/
