pragma ton-solidity >=0.43.0;

pragma AbiHeader pubkey;
pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';

import './interfaces/IDataCore.sol';

import './libraries/FeeValues.sol';
import './libraries/DataErrors.sol';

abstract contract DataCore is IDataCore, IndexResolver {
    uint256 static _id;

    uint8 public royalty;

    address _addrRoot;
    address _addrAuthor;
    address _addrOwner;
    address _addrTrusted;
    bytes dataName;
    bytes dataUrl;
    uint8 editionNumber;
    uint8 editionAmount;
    address[] managersListArr;

    mapping(address => uint8) managersList;

    function transferOwnership(address addrTo)
        public override
        enoughValueToTransferOwnership
    {
        require(msg.sender == _addrOwner && !isTrustedExists() || msg.sender == _addrTrusted,
                DataErr.OWNERSHIP_CANNOT_BE_TRANSFERRED,
                "Cannot transfer Data ownership");

        address oldIndexOwner = resolveIndex(_addrRoot, address(this), _addrOwner);
        IIndex(oldIndexOwner).destruct();
        address oldIndexOwnerRoot = resolveIndex(address(0), address(this), _addrOwner);
        IIndex(oldIndexOwnerRoot).destruct();

        _addrOwner = addrTo;
        delete managersList;
        delete managersListArr;

        deployIndex(addrTo);
    }

    function lendOwnership(address _addr)
        public override
        addressIsNotNull
    {
        require((msg.sender == _addrOwner || isManager(msg.sender)) && !isTrustedExists(),
                DataErr.RIGHTS_CANNOT_BE_GIVEN,
                "Cannot lend Data ownership");
        tvm.accept();
        _addrTrusted = _addr;
    }

    function returnOwnership()
        public override
        onlyTrusted
    {
        _addrTrusted = address(0);
    }

    function addManager(address _addr) external
        onlyOwner
        managerNotExists(_addr)
    {
        tvm.accept();
        managersList[_addr] = uint8(managersListArr.length);
        managersListArr.push(_addr);
    }

    function removeManager(address _addr) external
        onlyOwner
        managerExists(_addr)
    {
        tvm.accept();
        for (uint8 i = managersList[_addr]; i < managersListArr.length - 1; i++) {
            managersListArr[i] = managersListArr[i+1];
        }
        delete managersList[_addr];
    }

    function burn(address _dest) onlyOwner trustedNotExists external {
        tvm.accept();
        selfdestruct(_dest);
    }

    function getOwner() external view override returns(address addrOwner) {
        addrOwner = _addrOwner;
    }

    function getOwnerResponsible() external view override responsible returns(address addrOwner) {
        return { value: 0 ton, flag: 64 } (_addrOwner);
    }

    function getOwnershipProviders() external view override returns (
        address addrOwner,
        address addrTrusted,
        address addrRoyaltyAuthor,
        uint8 royaltyPercent
    ) {
        addrOwner = _addrOwner;
        addrTrusted = _addrTrusted;
        addrRoyaltyAuthor = _addrAuthor;
        royaltyPercent = royalty;
    }

    function getOwnershipProvidersResponsible() external view override responsible returns (
        address addrOwner,
        address addrTrusted,
        address addrRoyaltyAuthor,
        uint8 royaltyPercent
    ) {
        return { value: 0 ton, flag: 64 } (_addrOwner, _addrTrusted, _addrAuthor, royalty);
    }

    function getAllowance() external view returns (address addr) {
        addr = _addrTrusted;
    }

    function getManagersList() external view returns (address[] managers) {
        managers = managersListArr;
    }

    function deployIndex(address owner) internal {
        TvmCell codeIndexOwner = _buildIndexCode(_addrRoot, owner);
        TvmCell stateIndexOwner = _buildIndexState(codeIndexOwner, address(this));
        new Index{stateInit: stateIndexOwner, value: Fees.MIN_FOR_INDEX_DEPLOY}(_addrRoot);

        TvmCell codeIndexOwnerRoot = _buildIndexCode(address(0), owner);
        TvmCell stateIndexOwnerRoot = _buildIndexState(codeIndexOwnerRoot, address(this));
        new Index{stateInit: stateIndexOwnerRoot, value: Fees.MIN_FOR_INDEX_DEPLOY}(_addrRoot);
    }

    function isTrustedExists() private view returns (bool) {
        return _addrTrusted != address(0);
    }

    function isManager(address addrManager) private view returns (bool) {
        return managersList.exists(addrManager);
    }

    // MODIFIERS

    modifier onlyOwner {
        require(msg.sender == _addrOwner,
                DataErr.NOT_OWNER,
                "Action available only for Data owner");
        _;
    }

    modifier onlyTrusted {
        require(msg.sender == _addrTrusted,
                DataErr.NOT_TRUSTED,
                "Action available only for trusted address");
        _;
    }

    modifier trustedNotExists {
        require(!isTrustedExists(),
                DataErr.TRUSTED_EXISTS,
                "Trusted exists");
        _;
    }

    modifier addressIsNotNull {
        require(msg.sender != address(0),
                DataErr.NULL_ADDRESS,
                "Sender's address cannot be null");
        _;
    }

    modifier managerExists(address addrManager) {
        require(isManager(addrManager),
                DataErr.MANAGER_NOT_EXISTS,
                "Manager with this address doesn't exist");       
        _;
    }

    modifier managerNotExists(address addrManager) {
        require(!isManager(addrManager),
                DataErr.MANAGER_ALREADY_EXISTS,
                "Manager with this address already exists");       
        _;
    }

    modifier enoughValueToTransferOwnership {
        require(msg.value >= Fees.MIN_FOR_INDEX_DEPLOY,
               DataErr.NOT_ENOUGH_VALUE_TO_TRANSFER_OWNERSHIP,
               "Message balance is not enough for ownership transfer");       
        _;
    }

    // modifier enoughValueToReturnOwnership {
    //     require(msg.value >= Fees.MIN_FOR_MESSAGE,
    //            DataErr.NOT_ENOUGH_VALUE_TO_RETURN_OWNERSHIP,
    //            "Message balance is not enough for ownership returning");       
    //     _;
    // }
}
