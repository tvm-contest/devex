pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import 'ADataCore.sol';
import './interfaces/IData.sol';

contract Data is IData, DataCore {

    string _nftType;
    ColorEnum _additionalEnumParameter;//to make the parameter optional, uncomment line 53
    ColorEnum _defColor = ColorEnum.white; 

    string _additionalStrParameter; // to make the parameter required, uncomment line 50
    // Если нужно расширить контракт на минимальную длину строки, то раскомментируем строки 29 69
    // Если нужно расширить контракт на максмальную длину строки, то раскомментируем строки 30 70
    // uint constant _minLength = 5;
    // uint constant _maxLength = 50;
    uint256 _additionalIntParameter; //to make the parameter required, uncomment line 51
    bool _additionalBoolParameter;

    constructor(
        address addrOwner,
        TvmCell codeIndex,
        bytes _name,
        bytes _url,
        uint8 _editionNumber,
        uint8 _editionAmount,
        address[] _managersList,
        uint8 _royalty,

        string nftType,
        int additionalEnumParameter,
        string additionalStrParameter,
        uint256 additionalIntParameter,
        bool additionalBoolParameter
    )
        public
    {
        optional(TvmCell) optSalt = tvm.codeSalt(tvm.code());
        require(optSalt.hasValue(), 101);
        (address addrRoot) = optSalt.get().toSlice().decode(address);
        require(msg.sender == addrRoot);
        //require(additionalStrParameter != '', 123);
        //require(additionalIntParameter != 0, 123);
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

        for (uint8 i; i < _managersList.length; i++) {
            managersList[_managersList[i]] = i;
        }

        if((additionalEnumParameter < int(ColorEnum.lastEnum)) && (additionalEnumParameter >= 0)){
            _additionalEnumParameter = ColorEnum(additionalEnumParameter);
        } 
        else{
            //require(false == true,102,"Color ID not found");
            _additionalEnumParameter = _defColor;
        }    

        if(additionalStrParameter != '') {
        //    require(additionalStrParameter.byteLength() >= _minLength, 121);
        //    require(additionalStrParameter.byteLength() <= _maxLength, 122);
        }
        _additionalStrParameter = additionalStrParameter;
        _additionalBoolParameter = additionalBoolParameter;
        _additionalIntParameter = additionalIntParameter;

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
        ColorEnum color,
        string additionalStrParameter,
        uint256 additionalIntParameter,
        bool additionalBoolParameter,
        string nftType
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
        color = _additionalEnumParameter;
        additionalStrParameter = _additionalStrParameter;
        additionalIntParameter = _additionalIntParameter;
        additionalBoolParameter = _additionalBoolParameter;
        nftType = _nftType;
    }

    function getInfoResponsible() public view override responsible returns (
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount,
        ColorEnum color,
        string additionalStrParameter,
        uint256 additionalIntParameter,
        bool additionalBoolParameter
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
        editionAmount,
        _additionalEnumParameter,
        _additionalStrParameter,
        _additionalIntParameter,
        _additionalBoolParameter);
    }
}
