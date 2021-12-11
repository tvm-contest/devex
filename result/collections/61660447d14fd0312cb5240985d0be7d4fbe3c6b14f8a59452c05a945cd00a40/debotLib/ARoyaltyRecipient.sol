pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

abstract contract ARoyaltyRecipient {

    address _addrBeneficiary;
    uint8 _royaltyPercent;

    function changeBeneficiary(address addrBeneficiary) external onlyBeneficiary {
        _addrBeneficiary = addrBeneficiary;
    }

    function getRoyaltyInfo() external view returns (address addrBeneficiary, uint8 royaltyPercent) {
        addrBeneficiary = _addrBeneficiary;
        royaltyPercent = _royaltyPercent;
    }

    // MODIFIERS

    modifier validRoyalty(uint8 royaltyPercent) {
        require(royaltyPercent < 100);
        _;
    }

    modifier onlyBeneficiary {
        require(msg.sender == _addrBeneficiary);
        _;
    }
}