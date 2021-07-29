pragma ton-solidity >= 0.35.0;
pragma AbiHeader expire;
import "Subscription.sol";

/// @title Simple wallet
/// @author Tonlabs
contract Wallet {

    TvmCell subscr_Image;

    /// @dev Contract constructor.
    constructor(TvmCell image) public {

        require(tvm.pubkey() != 0, 101);
        require(msg.pubkey() == tvm.pubkey(), 102);
        tvm.accept();
        subscr_Image = image; 
    }

    /// @dev Allows to transfer tons to the destination account.
    /// @param dest Transfer target address.
    /// @param value Nanotons value to transfer.
    /// @param bounce Flag that enables bounce message in case of target contract error.
    function sendTransaction(address dest, uint128 value, bool bounce, uint256 serviceKey) public view {
         // Runtime function that allows to make a transfer with arbitrary settings.
        TvmCell code = subscr_Image.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: tvm.pubkey(),
            varInit: { serviceKey: serviceKey },
            contr: Subscription
        });
        require(msg.pubkey() == tvm.pubkey() || msg.sender == address(tvm.hash(newImage)), 100);

		// Runtime function that allows contract to process inbound messages spending
		// its own resources (it's necessary if contract should process all inbound messages,
		// not only those that carry value with them).
		tvm.accept();
        dest.transfer(value, bounce, 0);
    }
}
