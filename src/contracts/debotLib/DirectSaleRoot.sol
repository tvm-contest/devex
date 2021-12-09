pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import "DirectSale.sol";
import 'ARoyaltyRecipient.sol';

contract DirectSaleRoot is ARoyaltyRecipient {

    TvmCell _codeSale;

    constructor (
        TvmCell codeSale,
        address addrBeneficiary,
        uint8 royaltyPercent
    )
        public
        validRoyalty(royaltyPercent)
    {
        tvm.accept();
        _codeSale = codeSale;
        _addrBeneficiary = addrBeneficiary;
        _royaltyPercent = royaltyPercent;
    }

    function createSale (
        address addrNft,
        uint128 nftPrice,
        bool isDurationLimited
    )
        external view
        notZeroPrice(nftPrice)
        enoughValueToDeploySale
    {
        tvm.accept();
        
        tvm.rawReserve(address(this).balance - msg.value, 0);

        TvmCell stateSale = tvm.buildStateInit({
            code: _codeSale,
            contr: DirectSale,
            pubkey: tvm.pubkey(),
            varInit: { 
                _addrRoot: address(this),
                _addrOwner: msg.sender,
                _addrNft: addrNft
            }
        });

        // проверить на возможность повторного создания
        new DirectSale {
            stateInit: stateSale,
            value: Fees.MIN_FOR_SALE_DEPLOY
        }(
            nftPrice,
            isDurationLimited,
            _addrBeneficiary,
            _royaltyPercent
        );

        msg.sender.transfer({value: 0, flag: 128});
    }

    function getSaleAddress(address addrOwner, address addrNft) external view returns (address addrSale) {
        TvmCell stateSale = tvm.buildStateInit({
            contr: DirectSale,
            code: _codeSale,
            pubkey: tvm.pubkey(),
            varInit: {
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNft: addrNft
            }
        });
        addrSale = address(tvm.hash(stateSale));
    }

    // MODIFIERS

    modifier notZeroPrice(uint128 price) {
        require(price > 0, SaleErr.ZERO_PRICE);
        _;
    }

    modifier enoughValueToDeploySale {
        require(msg.value >= Fees.MIN_FOR_SALE_DEPLOY + Fees.MIN_FOR_MESSAGE,
               SaleErr.NOT_ENOUGH_VALUE_TO_DEPLOY_DATA,
               "Message balance is not enough for DirectSale deployment");
        _;
    }
}