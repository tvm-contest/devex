pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import "Auction.sol";
import 'ARoyaltyRecipient.sol';

contract AuctionRoot is ARoyaltyRecipient {

    TvmCell _codeAuction;

    constructor (
        TvmCell codeAuction,
        address addrBeneficiary,
        uint8 royaltyPercent
    )
        public
        validRoyalty(royaltyPercent)
    {
        tvm.accept();
        _codeAuction = codeAuction;
        _addrBeneficiary = addrBeneficiary;
        _royaltyPercent = royaltyPercent;
    }

    function createAuction(
        address addrNft,
        uint128 initialPrice,
        uint128 minBidStep
    )
        public
        notZeroInitialPrice(initialPrice)
        enoughValueForAuctionDeploy
    {
        tvm.accept();
        
        tvm.rawReserve(address(this).balance - msg.value, 0);

        TvmCell stateAuction = tvm.buildStateInit({
            code: _codeAuction,
            contr: Auction,
            pubkey: tvm.pubkey(),
            varInit: { 
                _addrRoot: address(this),
                _addrOwner: msg.sender,
                _addrNft: addrNft
            }
        });

        new Auction {
            stateInit: stateAuction,
            value: Fees.MIN_FOR_AUCTION_DEPLOY
        }(
            initialPrice,
            minBidStep
        );

        msg.sender.transfer({value: 0, flag: 128});
    }

    function getAuctionAddress(address addrOwner, address addrNft) external view returns (address addrAuction) {
        TvmCell stateAuction = tvm.buildStateInit({
            contr: Auction,
            code: _codeAuction,
            pubkey: tvm.pubkey(),
            varInit: {
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNft: addrNft
            }
        });
        addrAuction = address(tvm.hash(stateAuction));
    }

    // MODIFIERS

    modifier notZeroInitialPrice(uint128 price) {
        require(price > 0, AuctionErr.ZERO_INITIAL_PRICE);
        _;
    }

    modifier enoughValueForAuctionDeploy {
        require(msg.value >= Fees.MIN_FOR_AUCTION_DEPLOY + Fees.MIN_FOR_MESSAGE,
               AuctionErr.NOT_ENOUGH_VALUE_FOR_AUCTION_DEPLOY,
               "Message balance is not enough for Auction deployment");       
        _;
    }
}
