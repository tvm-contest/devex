all: contracts checks

SIBLING_DIR=../../02_euler/contracts

checks:
	diff Blueprint.sol ${SIBLING_DIR}/Blueprint.sol
	diff RecoverablePubkey.sol ${SIBLING_DIR}/RecoverablePubkey.sol

contracts: PubkeyRecovery.code RecoverableMultisigWallet.code

PubkeyRecovery.code: *.sol
	ft contract build PubkeyRecovery.sol -f


RecoverableMultisigWallet.code: *.sol
	ft contract build RecoverableMultisigWallet.sol -f
