pragma ton-solidity >= 0.35.0;
pragma AbiHeader expire;

/// @title Simple wallet
/// @author Tonlabs
contract Wallet {

    TvmCell subscr_Image;

    /// @dev Contract constructor.
    constructor(TvmCell image) public {
        require(tvm.pubkey() != 0, 101);
        require(msg.pubkey() == tvm.pubkey(), 102);
        subscr_Image = image;
        tvm.accept();
    }


    // Modifier that allows function to accept external call only if it was signed
    // with contract owner's public key.
    modifier checkOwnerAndAccept {
        // Check that inbound message was signed with owner's public key.
        // Runtime function that obtains sender's public key.
        require(msg.pubkey() == tvm.pubkey() || msg.sender() == , 100);

		// Runtime function that allows contract to process inbound messages spending
		// its own resources (it's necessary if contract should process all inbound messages,
		// not only those that carry value with them).
		tvm.accept();
		_;
    }

    /// @dev Allows to transfer tons to the destination account.
    /// @param dest Transfer target address.
    /// @param value Nanotons value to transfer.
    /// @param bounce Flag that enables bounce message in case of target contract error.
    function sendTransaction(address dest, uint128 value, bool bounce) public pure checkOwnerAndAccept {
         // Runtime function that allows to make a transfer with arbitrary settings.
        dest.transfer(value, bounce, 0);
    }
}
