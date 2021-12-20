pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import 'ADataCore.sol';
import './interfaces/IData.sol';
import './libraries/Enums.sol';

contract Data is IData, DataCore {

    address _addrNftRootRoyaltyAgent;
    uint8 _nftRootRoyaltyPercent;

    string _nftType;

    /*%PARAM_DEFENITION%*/

    constructor(
        address addrOwner,
        TvmCell codeIndex,
        bytes _name,
        bytes _url,
        uint8 _editionNumber,
        uint8 _editionAmount,
        address[] _managersList,
        uint8 _royalty,
        address addrNftRootRoyaltyAgent,
        uint8 nftRootRoyaltyPercent,

        string nftType/*%PARAM_CONSTRUCTOR%*/
    )
        public
    {
        optional(TvmCell) optSalt = tvm.codeSalt(tvm.code());
        require(optSalt.hasValue(), 101);
        (address addrRoot) = optSalt.get().toSlice().decode(address);
        require(msg.sender == addrRoot);
        tvm.accept();

        _addrRoot = addrRoot;
        _addrOwner = addrOwner;
        _addrAuthor = addrOwner;
        _codeIndex = codeIndex;
        dataName = _name;
        dataUrl = _url;
        editionNumber = _editionNumber;
        editionAmount = _editionAmount;
        managersListArr = _managersList;
        royalty = _royalty;
        _nftType = nftType;
        _addrNftRootRoyaltyAgent = addrNftRootRoyaltyAgent;
        _nftRootRoyaltyPercent = nftRootRoyaltyPercent;

        for (uint8 i; i < _managersList.length; i++) {
            managersList[_managersList[i]] = i;
        }
        /*%PARAM_SET%*/

        deployIndex(addrOwner);
    }

    function getInfo() public view override returns (
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount,
        string nftType/*%PARAM_DATA_INFO%*/
    ) {
        addrRoot = _addrRoot;
        addrOwner = _addrOwner;
        addrAuthor = _addrAuthor;
        addrData = address(this);
        id = _id;
        name = dataName;
        url = dataUrl;
        number = editionNumber;
        amount = editionAmount;
        nftType = _nftType;
        /*PARAM_SET_DATA_INFO*/
    }

    function getInfoResponsible() external view override responsible returns (
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount
    ) {
        return { value: 0 ton, flag: 64 } (
        _addrRoot,
        _addrOwner,
        _addrAuthor,
        address(this),
        _id,
        dataName,
        dataUrl,
        editionNumber,
        editionAmount);
    }

    function transferOwnership(address addrTo)
        public override(IDataCore, DataCore)
        enoughValueToTransferOwnership
    {
        require(isTrusted(msg.sender) || (!isTrustedExists() && isOwner(msg.sender)),
                DataErr.OWNERSHIP_CANNOT_BE_TRANSFERRED,
                "Cannot transfer Data ownership");

        if (isTrusted(msg.sender)) {
            uint128 initialValue = msg.value - Fees.MIN_FOR_TRANSFER_OWNERSHIP;
            uint128 sendableValue = initialValue;
            uint128 authorRoyaltyValue = math.muldiv(sendableValue, royalty, 100);
            _addrAuthor.transfer({value: authorRoyaltyValue, flag: 1});
            
            if (royalty + _nftRootRoyaltyPercent > 100) {
                sendableValue -= authorRoyaltyValue;
            }

            uint128 nftRootRoyaltyValue = math.muldiv(sendableValue, _nftRootRoyaltyPercent, 100);
            _addrNftRootRoyaltyAgent.transfer({value: nftRootRoyaltyValue, flag: 1});

            _addrOwner.transfer({value: initialValue - authorRoyaltyValue - nftRootRoyaltyValue, flag: 1});
        }

        address oldIndexOwner = resolveIndex(_addrRoot, address(this), _addrOwner);
        IIndex(oldIndexOwner).destruct();
        address oldIndexOwnerRoot = resolveIndex(address(0), address(this), _addrOwner);
        IIndex(oldIndexOwnerRoot).destruct();

        _addrOwner = addrTo;
        delete managersList;
        delete managersListArr;

        deployIndex(addrTo);
    }
}
