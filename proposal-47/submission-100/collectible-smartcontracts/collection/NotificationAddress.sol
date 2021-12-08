pragma ton-solidity >=0.47.0;

library NotificationAddress {
    function value() public returns(address){
        return address.makeAddrExtern(0xc54f05c8fc473d3cccdff0cd47dbb7aa3adbf29bc398cbd8176ef9f5573dc50e,256);
    }
}
