pragma ton-solidity >=0.43.0;

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
        public virtual override
        enoughValueToTransferOwnership
    {
        require(isTrusted(msg.sender) || (!isTrustedExists() && isOwner(msg.sender)),
                DataErr.OWNERSHIP_CANNOT_BE_TRANSFERRED,
                "Cannot transfer Data ownership");

        if (isTrusted(msg.sender)) {
            uint128 availableValue = msg.value - Fees.MIN_FOR_TRANSFER_OWNERSHIP;
            uint128 royaltyValue = math.muldiv(availableValue, royalty, 100);
            _addrAuthor.transfer({value: royaltyValue, flag: 1});
            _addrOwner.transfer({value: availableValue - royaltyValue, flag: 1});
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

    function lendOwnership(address _addr)
        external override
        validAddress
    {
        require(isTrusted(msg.sender) || (!isTrustedExists() && (isOwner(msg.sender) || isManager(msg.sender))),
                DataErr.RIGHTS_CANNOT_BE_GIVEN,
                "Cannot lend Data ownership");
        tvm.rawReserve(0, 4);
        _addrTrusted = _addr;
        msg.sender.transfer({value: 0, flag: 128});
    }

    function returnOwnership()
        external override
        onlyTrusted
    {
        tvm.rawReserve(0, 4);
        _addrTrusted = address(0);
        msg.sender.transfer({value: 0, flag: 128});
    }

    function addManager(address _addr)
        external
        onlyOwner
        managerNotExists(_addr)
    {
        managersList[_addr] = uint8(managersListArr.length);
        managersListArr.push(_addr);
    }

    function removeManager(address _addr)
        external
        onlyOwner
        managerExists(_addr)
    {
        for (uint8 i = managersList[_addr]; i < managersListArr.length - 1; i++) {
            managersListArr[i] = managersListArr[i+1];
        }
        delete managersList[_addr];
    }

    function burn(address _dest) onlyOwner trustedNotExists external {
        selfdestruct(_dest);
    }

    function getOwner() public view override returns (address addrOwner) {
        addrOwner = _addrOwner;
    }

    function getOwnerResponsible() public view override responsible returns (address addrOwner) {
        return { value: 0 ton, flag: 64 } (_addrOwner);
    }

    function verifyTradability(address addrPossibleOwner, address addrPossibleTrusted)
        public view override responsible
        returns (address addrOwner, address addrTrusted)
    {
        if (isOwner(addrPossibleOwner)) { addrOwner = addrPossibleOwner;}
        if (isTrusted(addrPossibleTrusted)) { addrTrusted = addrPossibleTrusted;}
        return { value: 0 ton, flag: 64 } (addrOwner, addrTrusted);
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
    
    function isOwner(address addrPossibleOwner) inline internal view returns (bool) {
        return _addrOwner == addrPossibleOwner;
    }

    function isTrusted(address addrPossibleTrusted) inline internal view returns (bool) {
        return _addrTrusted == addrPossibleTrusted;
    }

    function isManager(address addrPossibleManager) inline internal view returns (bool) {
        return managersList.exists(addrPossibleManager);
    }

    function isTrustedExists() inline internal view returns (bool) {
        return _addrTrusted != address(0);
    }

    // MODIFIERS

    modifier onlyOwner {
        require(isOwner(msg.sender),
                DataErr.NOT_OWNER,
                "Action available only for Data owner");
        _;
    }

    modifier onlyTrusted {
        require(isTrusted(msg.sender),
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

    modifier validAddress {
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
        require(msg.value >= Fees.MIN_FOR_TRANSFER_OWNERSHIP,
               DataErr.NOT_ENOUGH_VALUE_TO_TRANSFER_OWNERSHIP,
               "Message balance is not enough for ownership transfer");       
        _;
    }
}
