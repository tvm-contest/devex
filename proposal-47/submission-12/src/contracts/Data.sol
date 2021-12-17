pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './interfaces/IData.sol';
import './libraries/Constants.sol';
import './libraries/DataErrors.sol';

contract Data is IData, IndexResolver {
    uint8 constant ERROR_LIMIT = 114;

    struct paramInfo { 
        uint min;
        uint max; 
        bool required;
    }
    /*CONST*/

    uint256 static _id;

    address _addrRoot;
    address _addrAuthor;
    address _addrOwner;
    address _addrTrusted;
    bool _isRightsTransferable;
    /*PARAM_DEFENITION*/

    string _rarityName;
    string _url;

    constructor( 
        address addrOwner,
        TvmCell codeIndex,
        string rarityName,
        string url
        /*PARAM_CONSTRUCTOR*/
    )
        public
    {
        mapping(string => paramInfo) valuesLimit;
        /*PARAM_LIMIT*/
        optional(TvmCell) optSalt = tvm.codeSalt(tvm.code());
        require(optSalt.hasValue(), 101);
        (address addrRoot) = optSalt.get().toSlice().decode(address);

        require(msg.sender == addrRoot);

        tvm.accept();
        /*PARAM_REQUIRE*/

        _addrRoot = addrRoot;
        _addrOwner = addrOwner;
        _addrAuthor = addrOwner;
        _codeIndex = codeIndex;
        /*PARAM_SET*/

        _rarityName = rarityName;
        _url = url;

        deployIndex(addrOwner);
    }

    function transferOwnership(address addrTo)
        public override
        deploymentSolvency
        onlyOwnerWithoutTrustedOrOnlyTrusted
    {
        address oldIndexOwner = resolveIndex(_addrRoot, address(this), _addrOwner);
        IIndex(oldIndexOwner).destruct();
        address oldIndexOwnerRoot = resolveIndex(address(0), address(this), _addrOwner);
        IIndex(oldIndexOwnerRoot).destruct();

        _addrOwner = addrTo;
        _isRightsTransferable = false;

        deployIndex(addrTo);
    }

    function deployIndex(address owner) private {
        TvmCell codeIndexOwner = _buildIndexCode(_addrRoot, owner);
        TvmCell stateIndexOwner = _buildIndexState(codeIndexOwner, address(this));
        new Index{stateInit: stateIndexOwner, value: Constants.MIN_FOR_INDEX_DEPLOY}(_addrRoot);

        TvmCell codeIndexOwnerRoot = _buildIndexCode(address(0), owner);
        TvmCell stateIndexOwnerRoot = _buildIndexState(codeIndexOwnerRoot, address(this));
        new Index{stateInit: stateIndexOwnerRoot, value: Constants.MIN_FOR_INDEX_DEPLOY}(_addrRoot);
    }

    // владелец может давать права, только если у него нет доверенного контракта
    // доверенный контракт сможет передавать права, если только ему разрешено это действие
    function giveRightsTo(address addrTrusted)
        public override
        trustedAddressIsValid
        onlyOwnerWithoutTrustedOrOnlyEmpoweredTrusted
    {
        tvm.accept();
        _addrTrusted = addrTrusted;
        _isRightsTransferable = false; // новому доверенному адресу не разрешено передавать права
    }

    function returnRightsBack()
        public override
        onlyTrusted
    {
        tvm.accept();
        _addrTrusted = address(0);
    }

    function allowTrustedToTransferRights()
        public
        onlyOwner
        trustedAddressExists
        trustedCannotTransferRights
    {
        tvm.accept();
        _isRightsTransferable = true;
    }

    function forbidTrustedToTransferRights()
        public
        onlyOwner
        trustedAddressExists
        trustedCanTransferRights
    {
        tvm.accept();
        _isRightsTransferable = false;
    }

    function getOwner() public view override returns(address addrOwner) {
        addrOwner = _addrOwner;
    }

    function getInfo() public view override returns (
        address addrData,
        address addrRoot,
        address addrOwner,
        address addrTrusted
    ) {
        addrData = address(this);
        addrRoot = _addrRoot;
        addrOwner = _addrOwner;
        addrTrusted = _addrTrusted;
    }

    function getParamsInfo() public view  returns (
        string rarityName,
        string url
        /*PARAM_GETINFO*/
    ) {
        rarityName = _rarityName;
        url = _url;
        /*PARAM_ASSIGNMENT_GETINFO*/
        
    }
    
      function getRarity() public returns(
        string rarityName
    ) {
        rarityName = _rarityName;
    }



    function rightsTransferabilityStatus() public view override onlyOwnerOrTrusted returns(bool status) {
        status = _isRightsTransferable;
    }

    function getTradabilityInfo() public view override responsible returns (
        address addrNftOwner,
        address addrTrusted
    ) {
        return {value: 1 ton, bounce: false, flag: 64} (_addrOwner, _addrTrusted);
    }

    // нулевой адрес больше добавить нельзя, так что проверка isTrustedExists должна быть корректной
    function isTrustedExists() private view returns (bool) {
        return _addrTrusted != address(0);
    }

    modifier onlyOwner {
        require(msg.sender == _addrOwner, DataErr.NOT_OWNER);
        _;
    }

    modifier onlyTrusted {
        require(msg.sender == _addrTrusted, DataErr.NOT_TRUSTED);
        _;
    }

    modifier onlyOwnerOrTrusted {
        require(msg.sender == _addrOwner || msg.sender == _addrTrusted,
                DataErr.NOR_OWNER_OR_TRUSTED);
        _;
    }

    modifier onlyOwnerWithoutTrustedOrOnlyTrusted {
        require(msg.sender == _addrOwner && !isTrustedExists() ||
                msg.sender == _addrTrusted,
                DataErr.OWNERSHIP_CANNOT_BE_TRANSFERRED);
        _;
    }

    modifier onlyOwnerWithoutTrustedOrOnlyEmpoweredTrusted {
        require(msg.sender == _addrOwner && !isTrustedExists() ||
                msg.sender == _addrTrusted &&  _isRightsTransferable,
                DataErr.RIGHTS_CANNOT_BE_GIVEN);
        _;
    }

    modifier trustedAddressExists {
        require(isTrustedExists(), DataErr.TRUSTED_NOT_EXISTS);       
        _;
    }

    modifier trustedCanTransferRights {
        require(_isRightsTransferable, DataErr.TRUSTED_CANNOT_TRANSFER_RIGHTS);       
        _;
    }

    modifier trustedCannotTransferRights {
        require(!_isRightsTransferable, DataErr.TRUSTED_CAN_TRANSFER_RIGHTS);       
        _;
    }

    modifier trustedAddressIsValid {
        require(msg.sender != address(0), DataErr.INVALID_ADDRESS);       
        _;
    }

    modifier deploymentSolvency {
        require(msg.value >= Constants.MIN_FOR_DEPLOY, DataErr.LOW_VALUE_TO_DEPLOY);       
        _;
    }
}