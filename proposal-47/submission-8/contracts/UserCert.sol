pragma ton-solidity >= 0.44.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

contract UserCert {

    //code salt owner
    address static _token;

    constructor() public {
        require(msg.sender == _token, 101);
    }

    function remove() public {
        require(msg.sender == _token, 101);
        selfdestruct(_token);
    }

    function getToken() public view returns(address token) {
        token = _token;
    }
}
