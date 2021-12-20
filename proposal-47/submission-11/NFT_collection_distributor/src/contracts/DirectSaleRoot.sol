pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import "DirectSale.sol";
import 'ARoyaltyRecipient.sol';
import './interfaces/IDirectSaleRoot.sol';

contract DirectSaleRoot is IDirectSaleRoot, ARoyaltyRecipient {

    TvmCell _codeSale;

    constructor (
        TvmCell codeSale,
        address addrRoyaltyAgent,
        uint8 royaltyPercent
    )
        public
        validRoyalty(royaltyPercent)
        validRoyaltyAgent(addrRoyaltyAgent)
    {
        tvm.accept();

        _codeSale = codeSale;
        _addrRoyaltyAgent = addrRoyaltyAgent;
        _royaltyPercent = royaltyPercent;
    }

    function createSale (address addrNft)
        external view override
        enoughValueToCreateSale
    {    
        tvm.rawReserve(0, 4);

        IData(addrNft).verifyTradability{
            value: Fees.MIN_FOR_SALE_DEPLOY,
            callback: approveCreateSale
        }(msg.sender, address(this));

        msg.sender.transfer({value: 0, flag: 128});
    }

    function approveCreateSale(address addrOwner, address addrTrusted)
        public view
        nftManagementIsPossible(addrOwner, addrTrusted)
    {
        TvmCell stateSale = tvm.buildStateInit({
            contr: DirectSale,
            code: _codeSale,
            varInit: { 
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNft: msg.sender
            }
        });

        address addrSale = address(tvm.hash(stateSale));
        IData(msg.sender).lendOwnership{ value: Fees.MIN_FOR_MESSAGE }(addrSale);

        new DirectSale {
            stateInit: stateSale,
            value: Fees.MIN_FOR_SALE_DEPLOY
        }(
            _addrRoyaltyAgent,
            _royaltyPercent
        );
    }

    function returnRights(address addrNft)
        external view override
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

    function getSaleAddress(address addrOwner, address addrNft) external view override returns (address addrSale) {
        TvmCell stateSale = tvm.buildStateInit({
            contr: DirectSale,
            code: _codeSale,
            varInit: { 
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNft: addrNft
            }
        });
        addrSale = address(tvm.hash(stateSale));
    }

    function getCodeSale() external view returns (TvmCell codeSale) {
        codeSale = _codeSale;
    }

    // MODIFIERS

    modifier enoughValueToCreateSale {
        require(msg.value >= Fees.MIN_FOR_SALE_DEPLOY + Fees.MIN_FOR_MESSAGE,
               SaleErr.NOT_ENOUGH_VALUE_TO_DEPLOY_DATA,
               "Message balance is not enough to create sale");
        _;
    }

    modifier enoughValueToReturnRights {
        require(msg.value >= Fees.MIN_FOR_RETURN_RIGHTS + Fees.MIN_FOR_MESSAGE,
               SaleErr.NOT_ENOUGH_VALUE_TO_RETURN_RIGHTS,
               "Message balance is not enough to return rights");
        _;
    }

    modifier nftManagementIsPossible(address addrNftOwner, address addrTrusted) {
        require(addrNftOwner != address(0) && addrTrusted != address(0),
                SaleErr.NO_RIGHTS_TO_TRADE,
                "No rights to sell the NFT");
        _;
    }
}