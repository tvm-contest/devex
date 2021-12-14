pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import "Auction.sol";
import 'ARoyaltyRecipient.sol';

contract AuctionRoot is ARoyaltyRecipient {

    TvmCell _codeAuction;

    constructor (
        TvmCell codeAuction,
        address addrRoyaltyAgent,
        uint8 royaltyPercent
    )
        public
        validRoyalty(royaltyPercent)
    {
        tvm.accept();
        _codeAuction = codeAuction;
        _addrRoyaltyAgent = addrRoyaltyAgent;
        _royaltyPercent = royaltyPercent;
    }


    function createAuction(address addrNft)
        external view
        enoughValueForAuctionDeploy
    {    
        tvm.rawReserve(0, 4);

        IData(addrNft).verifyTradability{
            value: Fees.MIN_FOR_AUCTION_DEPLOY,
            callback: approveCreateAuction
        }(msg.sender, address(this));

        msg.sender.transfer({value: 0, flag: 128});
    }

    function approveCreateAuction(address addrOwner, address addrTrusted)
        public view
        nftManagementIsPossible(addrOwner, addrTrusted)
    {
        TvmCell stateAuction = tvm.buildStateInit({
            contr: Auction,
            code: _codeAuction,
            varInit: { 
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNft: msg.sender
            }
        });

        address addrAuction = address(tvm.hash(stateAuction));
        IData(msg.sender).lendOwnership{ value: Fees.MIN_FOR_MESSAGE }(addrAuction);

        new Auction {
            stateInit: stateAuction,
            value: Fees.MIN_FOR_AUCTION_DEPLOY
        }(
            _addrRoyaltyAgent,
            _royaltyPercent
        );
    }

    function returnRights(address addrNft)
        external view
        enoughValueToReturnRights
    {    
        tvm.rawReserve(0, 4);

        IData(addrNft).verifyTradability{
            value: Fees.MIN_FOR_RETURN_RIGHTS,
            callback: approveReturnRights
        }(msg.sender, address(this));

        msg.sender.transfer({value: 0, flag: 128});
    }

    function approveReturnRights(address addrOwner, address addrTrusted)
        public view
        nftManagementIsPossible(addrOwner, addrTrusted)
    {
        IData(msg.sender).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();
    }

    function getAuctionAddress(address addrOwner, address addrNft) external view returns (address addrAuction) {
        TvmCell stateAuction = tvm.buildStateInit({
            contr: Auction,
            code: _codeAuction,
            varInit: { 
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNft: addrNft
            }
        });
        addrAuction = address(tvm.hash(stateAuction));
    }

    // MODIFIERS

    modifier enoughValueForAuctionDeploy {
        require(msg.value >= Fees.MIN_FOR_AUCTION_DEPLOY + Fees.MIN_FOR_MESSAGE,
               AuctionErr.NOT_ENOUGH_VALUE_FOR_AUCTION_DEPLOY,
               "Message balance is not enough for Auction deployment");       
        _;
    }

    modifier enoughValueToReturnRights {
        require(msg.value >= Fees.MIN_FOR_SALE_DEPLOY,
               505,
               "Message balance is not enough for DirectSale deployment");
        _;
    }

    modifier nftManagementIsPossible(address addrNftOwner, address addrTrusted) {
        require(addrNftOwner != address(0) && addrTrusted != address(0),
                506,
                "No rights to sell the NFT");
        _;
    }
}
